# Facial Recognition Attendance System

A comprehensive facial recognition system for automated student attendance tracking. The system consists of a Flask-based API backend and a modern web frontend for easy interaction.

## Project Overview

This system uses deep learning models to:

- Detect and recognize student faces in real-time
- Track and log attendance automatically
- Provide a user-friendly interface for administrators
- Support multiple face images per student for better accuracy

## System Architecture

The project is divided into three main components:

1. **API Backend** (`/api`)

   - Flask-based REST API
   - Face detection and recognition using DeepFace
   - Student database management
   - Attendance logging

2. **Web Frontend** (`/front`)

   - Simple web interface with HTML, CSS, and JS
   - Real-time face detection
   - Attendance dashboard
   - Student management interface

3. **Standalone Version** (`/standalone`)
   - Simplified version for basic use cases
   - Single-file implementation
   - No database required

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Modern web browser
- Webcam (for face detection)
- GPU recommended for better performance

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd facial-rec
```

2. Install backend dependencies:

```bash
cd api
pip install -r requirements.txt
```

### Running the System

1. Start the API server:

```bash
cd api
python app.py
```

2. Start the frontend development server:

```bash
cd front
```

open the index.html file in the browser to access the web interface

## Directory Structure

```plaintext
facial-rec/
├── api/               # Backend API
│   ├── app.py         # Main Flask application
│   ├── student_utils.py
│   ├── seed_students.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── README.md
│   ├── attendance.csv
│   ├── student_embeddings.pkl
│   ├── uploads/       # Temporary image storage
│   └── students/      # Student face database
├── front/             # Web frontend
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── README.md
└── standalone/        # Simplified version
    ├── camera_to_api.py
    ├── requirements.txt
    ├── camera_matches.csv
    └── README.md
```

## Features

- **Face Recognition**

  - Real-time face detection
  - Multiple face support per student
  - High accuracy matching

- **Attendance Management**

  - Automatic attendance logging
  - Attendance history tracking
  - Export functionality

- **Student Management**

  - Easy student registration
  - Multiple face image support
  - Student profile management

- **Security**
  - Secure API endpoints
  - CORS protection
  - Input validation

## Docker Support

The system can be deployed using Docker:

```bash
docker-compose up -d
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Made by [Moctar Aloeimine](https://ma.linkedin.com/in/aloeimine-moctar-1429b9199) to automate facial attendance and smart student tracking.

## Acknowledgments

- DeepFace library for face recognition
- Flask for the backend API
- React for the frontend interface
