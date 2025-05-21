# Facial Recognition API

A Flask-based API that provides face recognition endpoints for student matching and attendance tracking. The API uses deep learning models to identify faces and maintain attendance records.

---

## Features

- Face detection and recognition using deep learning models
- Student registration with support for multiple face images
- Real-time attendance tracking and logging
- RESTful API endpoints with CORS support
- Docker support for easy deployment

---

## Requirements

Install dependencies using pip:

```bash
pip install flask tf-keras deepface opencv-python scipy
```

> **Note**: The API uses deep learning models, so a GPU is recommended for better performance.

---

## Quick Start

1. Clone and setup:

```bash
git clone <repository-url>
cd facial-rec/api
pip install -r requirements.txt
```

2. Run the server:

```bash
python app.py
```

The API will be available at `http://localhost:5000`

---

## API Endpoints

| Endpoint      | Method | Description            | Response                                         |
| ------------- | ------ | ---------------------- | ------------------------------------------------ |
| `/`           | GET    | Health check           | `{"message": "Face Recognition API is running"}` |
| `/match`      | POST   | Match a face image     | `{"match": "student_name"}`                      |
| `/students`   | POST   | Add new student        | `{"status": "Student added successfully"}`       |
| `/attendance` | GET    | Get attendance records | `{"attendance": [...]}`                          |

### Request Formats

#### Match Face

```bash
curl -X POST -F "image=@face.jpg" http://localhost:5000/match
```

#### Add Student

```bash
curl -X POST -F "name=John" -F "images=@face1.jpg" -F "images=@face2.jpg" http://localhost:5000/students
```

---

## Docker Deployment

Build and run using Docker Compose:

```bash
docker-compose up -d
```

---

## Project Structure

```
api/
├── app.py              # Main Flask application
├── student_utils.py    # Face recognition utilities
├── seed_students.py    # Database seeding utility
├── requirements.txt    # Dependencies
├── Dockerfile         # Docker configuration
├── uploads/           # Temporary image storage
└── students/          # Student face database
```

## Database Seeding

The `seed_students.py` script is used to build the initial face recognition database from student images. It:

- Processes images from the `students/` directory
- Generates face embeddings using the Facenet model
- Creates a pickle file (`student_embeddings.pkl`) containing all embeddings

To seed the database:

```bash
python seed_students.py
```

Each student should have their own subdirectory in the `students/` folder containing their face images (`.jpg`, `.jpeg`, or `.png`).

---

## Error Handling

The API handles common errors with appropriate status codes:

- `400`: Bad Request (missing files, invalid input)
- `500`: Server Error (face detection failures, processing errors)

---

## Security

- Temporary files are automatically cleaned up
- CORS enabled for frontend integration
- Input validation on all endpoints

---

## Author

Made by [Moctar Aloeimine](https://ma.linkedin.com/in/aloeimine-moctar-1429b9199) to automate facial attendance and smart student tracking.

---
