import sqlite3
from datetime import datetime
import os

DB_PATH = "facial_rec.db"

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create students table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        embedding BLOB NOT NULL,
        image_path TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create attendance table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id)
    )
    ''')
    
    conn.commit()
    conn.close()

def add_student(name, embedding, image_path=None):
    """Add a new student with their face embedding and image path, or update if name exists"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if student exists
    cursor.execute("SELECT id FROM students WHERE name = ?", (name,))
    existing_student = cursor.fetchone()
    
    if existing_student:
        # Update existing student
        cursor.execute(
            "UPDATE students SET embedding = ?, image_path = ? WHERE name = ?",
            (embedding, image_path, name)
        )
    else:
        # Insert new student
        cursor.execute(
            "INSERT INTO students (name, embedding, image_path) VALUES (?, ?, ?)",
            (name, embedding, image_path)
        )
    
    conn.commit()
    conn.close()

def get_student_embeddings():
    """Get all student embeddings"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name, embedding FROM students")
    students = cursor.fetchall()
    conn.close()
    return students

def log_attendance(student_name):
    """Log attendance for a student"""
    if student_name == "Unknown":
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get student ID
    cursor.execute("SELECT id FROM students WHERE name = ?", (student_name,))
    result = cursor.fetchone()
    
    if result:
        student_id = result[0]
        cursor.execute(
            "INSERT INTO attendance (student_id, timestamp) VALUES (?, ?)",
            (student_id, datetime.now().isoformat())
        )
    
    conn.commit()
    conn.close()

def get_attendance():
    """Get all attendance records"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT s.name, a.timestamp 
        FROM attendance a 
        JOIN students s ON a.student_id = s.id 
        ORDER BY a.timestamp DESC
    ''')
    records = cursor.fetchall()
    conn.close()
    return [{"name": name, "timestamp": timestamp} for name, timestamp in records]

def get_students():
    """Get all students"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, image_path, created_at FROM students ORDER BY id DESC")
    students = cursor.fetchall()
    conn.close()
    return [{"id": id, "name": name, "image_path": image_path, "created_at": created_at} for id, name, image_path, created_at in students]

def get_student_by_id(student_id):
    """Get a student by their ID"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, image_path, created_at FROM students WHERE id = ?", (student_id,))
    student = cursor.fetchone()
    conn.close()
    return {"id": student[0], "name": student[1], "image_path": student[2], "created_at": student[3]} if student else None

def delete_student(student_id):
    """Delete a student and their attendance records"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Delete attendance records first (due to foreign key constraint)
    cursor.execute("DELETE FROM attendance WHERE student_id = ?", (student_id,))
    # Delete the student
    cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
    
    conn.commit()
    conn.close()
    return cursor.rowcount > 0  # Return True if a student was deleted 
