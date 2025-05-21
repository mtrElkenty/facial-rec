import cv2
import requests
import time
import argparse
import os
import csv
from datetime import datetime
import face_recognition

API_URL = "http://localhost:5000/match"
LOG_FILE = "camera_matches.csv"

def capture_and_send(frame):
    _, img_encoded = cv2.imencode('.jpg', frame)
    files = {'image': ('frame.jpg', img_encoded.tobytes(), 'image/jpeg')}

    try:
        response = requests.post(API_URL, files=files)
        if response.status_code == 200:
            data = response.json()
            name = data.get('match', 'Unknown')
            timestamp = datetime.now().isoformat()
            print(f"[MATCH] {name} at {timestamp}")
            log_match(name, timestamp)
        else:
            print(f"[ERROR] Server returned {response.status_code}")
    except Exception as e:
        print(f"[EXCEPTION] {e}")

def log_match(name, timestamp):
    os.makedirs(os.path.dirname(LOG_FILE) or '.', exist_ok=True)
    with open(LOG_FILE, mode="a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([name, timestamp])

def detect_faces(frame):
    # Convert from BGR (OpenCV) to RGB (face_recognition)
    rgb_frame = frame[:, :, ::-1]
    face_locations = face_recognition.face_locations(rgb_frame)
    return len(face_locations) > 0

def run_camera_stream(interval):
    print(f"[INFO] Starting webcam. Capturing every {interval}s if face is detected.")
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[ERROR] Cannot access webcam")
        return

    last_capture_time = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] Failed to grab frame")
            break

        cv2.imshow("Camera Feed - Press 'q' to exit", frame)

        current_time = time.time()
        if current_time - last_capture_time >= interval:
            if detect_faces(frame):
                capture_and_send(frame)
                last_capture_time = current_time
            else:
                print("[INFO] No face detected.")

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

def main():
    parser = argparse.ArgumentParser(description="Camera to Face Recognition API")
    parser.add_argument("--interval", type=int, default=5, help="Interval (in seconds) between frame checks")
    args = parser.parse_args()
    run_camera_stream(args.interval)

if __name__ == "__main__":
    main()
