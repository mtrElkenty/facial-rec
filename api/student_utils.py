import pickle
from deepface import DeepFace
from scipy.spatial.distance import cosine
from datetime import datetime
import os
from database import (
    init_db,
    add_student as db_add_student,
    get_student_embeddings,
    log_attendance as db_log_attendance,
    get_attendance as db_get_attendance,
    DB_PATH
)

THRESHOLD = 0.5

# Initialize database only if it doesn't exist
if not os.path.exists(DB_PATH):
    init_db()

def get_face_embedding(img_path):
    try:
        # Verify file exists and is readable
        if not os.path.exists(img_path):
            raise FileNotFoundError(f"Image file not found: {img_path}")
        
        # Check file size
        file_size = os.path.getsize(img_path)
        if file_size == 0:
            raise ValueError(f"Image file is empty: {img_path}")
            
        print(f"Processing image: {img_path} (size: {file_size} bytes)")
        
        result = DeepFace.represent(img_path=img_path, model_name="Facenet", enforce_detection=False)
        return result[0]["embedding"]
    except Exception as e:
        print(f"Error processing image {img_path}: {str(e)}")
        raise

def add_student(name, image_path, first_image_path=None):
    embedding = get_face_embedding(image_path)
    # Convert embedding to bytes for storage
    embedding_bytes = pickle.dumps(embedding)
    db_add_student(name, embedding_bytes, image_path=first_image_path)

def find_best_match(live_embedding):
    best_match = "Unknown"
    best_score = 1
    
    # Get all students from database
    students = get_student_embeddings()
    
    for name, emb_bytes in students:
        # Convert bytes back to embedding
        emb = pickle.loads(emb_bytes)
        # Score: 0 -> 1. Best to worst
        score = cosine(live_embedding, emb)
        print(f"Score for {name}: {score}") 
        if score < best_score and score < THRESHOLD:
            best_match = name
            best_score = score
    return best_match

def log_attendance(name):
    db_log_attendance(name)

def get_attendance():
    return db_get_attendance()
