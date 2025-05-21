import pickle
from deepface import DeepFace
from scipy.spatial.distance import cosine
from datetime import datetime
import csv
import os

DB_FILE = "student_embeddings.pkl"
ATTENDANCE_FILE = "attendance.csv"
THRESHOLD = 0.5

# Global in-memory database
student_embeddings = []

def load_embeddings():
    global student_embeddings
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "rb") as f:
            student_embeddings = pickle.load(f)
    else:
        student_embeddings = []

def save_embeddings():
    with open(DB_FILE, "wb") as f:
        pickle.dump(student_embeddings, f)

def get_face_embedding(img_path):
    result = DeepFace.represent(img_path=img_path, model_name="Facenet", enforce_detection=True)
    return result[0]["embedding"]

def add_student(name, image_path):
    embedding = get_face_embedding(image_path)
    student_embeddings.append((name, embedding))
    save_embeddings()

def find_best_match(live_embedding):
    best_match = "Unknown"
    best_score = 1
    for name, emb in student_embeddings:
        score = cosine(live_embedding, emb)
        print(f"Score for {name}: {score}") 
        if score < best_score and score < THRESHOLD:
            best_match = name
            best_score = score
    return best_match

def log_attendance(name):
    if name == "Unknown":
        return
    timestamp = datetime.now().isoformat()
    with open(ATTENDANCE_FILE, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([name, timestamp])

def get_attendance():
    try:
        with open(ATTENDANCE_FILE, "r") as file:
            return list(csv.reader(file))
    except FileNotFoundError:
        return []
