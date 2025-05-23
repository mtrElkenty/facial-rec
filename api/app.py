import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from student_utils import (
    get_face_embedding,
    find_best_match,
    log_attendance,
    get_attendance,
    add_student
)
from database import delete_student, get_student_by_id, get_students

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
UPLOAD_FOLDER = "uploads"
STUDENT_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, "students", "images")
TMP_FOLDER = os.path.join(UPLOAD_FOLDER, "tmp")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STUDENT_IMAGES_FOLDER, exist_ok=True)
os.makedirs(TMP_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return jsonify({"message": "Face Recognition API is running"}), 200

@app.route("/match", methods=["POST"])
def match():
    if "image" not in request.files:
        print("No image uploaded")
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    path = os.path.join(UPLOAD_FOLDER, image.filename)
    image.save(path)

    try:
        embedding = get_face_embedding(path)
        name = find_best_match(embedding)
        log_attendance(name)
        return jsonify({"match": name})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        os.remove(path)

@app.route("/students", methods=["POST"])
def add_new_student():
    name = request.form.get("name")
    if not name or "images" not in request.files:
        return jsonify({"error": "Missing name or images"}), 400

    images = request.files.getlist("images")
    if not images:
        return jsonify({"error": "No images provided"}), 400

    print(f"Received request with {len(images)} images")
    saved_paths = []
    try:
        # Save the first image as the student's profile image
        first_image = images[0]
        if not first_image.filename:
            return jsonify({"error": "Invalid image file"}), 400
            
        print(f"Processing first image: {first_image.filename}")
        print(f"Content type: {first_image.content_type}")
        print(f"Content length: {request.content_length}")

        # Validate image file extension
        allowed_extensions = {'jpg', 'jpeg', 'png'}
        if '.' not in first_image.filename or first_image.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({"error": "Invalid image format. Allowed formats: jpg, jpeg, png"}), 400

        # Check if the file is actually an image
        if not first_image.content_type or not first_image.content_type.startswith('image/'):
            return jsonify({"error": "Invalid file type. Please upload an image file."}), 400

        image_filename = f"{name.lower().replace(' ', '_')}_{os.urandom(4).hex()}.jpg"
        image_path = os.path.join(STUDENT_IMAGES_FOLDER, image_filename)
        
        # Save and verify the file was written correctly
        print(f"Saving first image to: {image_path}")
        first_image.save(image_path)
        file_size = os.path.getsize(image_path)
        print(f"First image saved. File size: {file_size} bytes")
        
        if file_size == 0:
            raise ValueError("Failed to save the image file - file is empty")
            
        relative_image_path = os.path.join("students", "images", image_filename)

        # Process all images for face recognition
        for idx, image in enumerate(images):
            if not image.filename:
                print(f"Skipping image {idx} - no filename")
                continue
                
            print(f"\nProcessing image {idx + 1}: {image.filename}")
            print(f"Content type: {image.content_type}")
                
            # Validate image file extension
            if '.' not in image.filename or image.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
                print(f"Skipping invalid image format: {image.filename}")
                continue
                
            # Check if the file is actually an image
            if not image.content_type or not image.content_type.startswith('image/'):
                print(f"Skipping invalid file type: {image.filename}")
                continue
                
            path = os.path.join(TMP_FOLDER, image.filename)
            print(f"Saving image to: {path}")
            
            # Read the file content before saving
            file_content = image.read()
            print(f"Read {len(file_content)} bytes from image")
            
            # Reset file pointer
            image.seek(0)
            
            # Save the file
            image.save(path)
            
            # Verify the file was written correctly
            file_size = os.path.getsize(path)
            print(f"File saved. Size: {file_size} bytes")
            
            if file_size == 0:
                print(f"Warning: Failed to save image {image.filename} - file is empty")
                continue
                
            saved_paths.append(path)
            print(f"Successfully saved image to: {path}")
            add_student(name=name, image_path=path, first_image_path=relative_image_path)

        if not saved_paths:
            return jsonify({"error": "No valid images were processed"}), 400

        return jsonify({"status": f"Student '{name}' added successfully with {len(saved_paths)} images"})
    except Exception as e:
        traceback.print_exc()
        print(f"Error adding student: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        for path in saved_paths:
            if os.path.exists(path):
                os.remove(path)

@app.route("/attendance", methods=["GET"])
def attendance():
    attendance = get_attendance()
    return jsonify({"attendance": attendance})

@app.route("/students", methods=["GET"])
def get_all_students():
    try:
        students = get_students()
        return jsonify({"students": students})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    try:
        student = get_student_by_id(student_id)
        if student:
            return jsonify(student)
        return jsonify({"error": "Student not found"}), 404
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/students/<int:student_id>", methods=["DELETE"])
def remove_student(student_id):
    try:
        if delete_student(student_id):
            return jsonify({"status": "Student deleted successfully"})
        return jsonify({"error": "Student not found"}), 404
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/uploads/<path:filename>")
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
