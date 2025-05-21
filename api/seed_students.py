import os
import pickle
from deepface import DeepFace

STUDENT_FOLDER = "students/"
DB_FILE = "student_embeddings.pkl"

def build_student_db():
    student_embeddings = []

    for student_name in os.listdir(STUDENT_FOLDER):
        student_path = os.path.join(STUDENT_FOLDER, student_name)

        if not os.path.isdir(student_path):
            continue  # Skip non-directories

        print(f"[+] Processing {student_name}...")

        for file in os.listdir(student_path):
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                file_path = os.path.join(student_path, file)
                try:
                    print(f"  [-] Encoding {file}...")
                    embedding = DeepFace.represent(img_path=file_path, model_name="Facenet")[0]["embedding"]
                    student_embeddings.append((student_name, embedding))
                except Exception as e:
                    print(f"  [!] Failed on {file}: {e}")

    # Save database to file
    with open(DB_FILE, "wb") as f:
        pickle.dump(student_embeddings, f)

    print(f"[✓] Seeded {len(student_embeddings)} images for {len(set(name for name, _ in student_embeddings))} students.")

if __name__ == "__main__":
    build_student_db()
