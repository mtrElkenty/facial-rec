import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from student_utils import (
    get_face_embedding,
    find_best_match,
    log_attendance,
    get_attendance,
    add_student,
    load_embeddings
)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load known students into memory
load_embeddings()

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

    saved_paths = []
    try:
        for image in images:
            path = os.path.join(UPLOAD_FOLDER, image.filename)
            image.save(path)
            saved_paths.append(path)
            add_student(name, path)
        return jsonify({"status": f"Student '{name}' added successfully with {len(images)} images"})
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
    records = get_attendance()
    return jsonify({"attendance": records})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
