# Camera to Face Recognition API

This script captures frames from your webcam, detects faces using `face_recognition`, and sends the frame to a face recognition API **only when a face is detected**. Matches are logged to a CSV file for attendance or auditing.

---

## Features

- Captures webcam feed using OpenCV.
- Uses `face_recognition` for accurate face detection.
- Sends frames to a configurable API (`http://localhost:5000/match`) if a face is found.
- Logs results (`name`, `timestamp`) to `camera_matches.csv`.
- Customizable interval between checks using a CLI flag (`--interval`).

---

## Requirements

Install dependencies using pip:

```bash
pip install opencv-python dlib face_recognition requests
```

> **Windows users**: `face_recognition` requires CMake and Visual Studio Build Tools.
> See [face_recognition installation guide](https://github.com/ageitgey/face_recognition#installation) for platform-specific instructions.

---

## Usage

```bash
python camera_to_api.py --interval 5
```

### CLI Arguments

| Flag         | Description                                     | Default |
| ------------ | ----------------------------------------------- | ------- |
| `--interval` | Interval in seconds between face checks/frames. | `5`     |

Press **`q`** to quit the camera feed.

---

## How It Works

1. Opens the webcam and reads frames in real-time.
2. Converts each frame to RGB and checks for faces using `face_recognition`.
3. If a face is detected:

   - Sends the frame to `http://localhost:5000/match` via POST request (`multipart/form-data`).
   - Logs the returned match (or "Unknown") to `camera_matches.csv` with a timestamp.

4. Waits for the specified interval before checking the next frame.

---

## Output

- **Log File**: `camera_matches.csv`
  Format:

  ```
  Name,Timestamp
  Alice,2025-05-21T20:01:14.123456
  Bob,2025-05-21T20:06:32.654321
  ```

---

## API Integration

Make sure your API server (e.g., Flask app) is running at:

```
POST http://localhost:5000/match
```

Expected response format:

```json
{
  "match": "Moctar"
}
```

---

## Exiting

To exit the camera view, **press `q`** in the camera window.

---

## Notes

- If no face is detected, the frame is **not sent**, helping reduce unnecessary requests.
- This tool is suitable for attendance systems or real-time face match logging.

---

## Author

Made by [Moctar Aloeimine](https://ma.linkedin.com/in/aloeimine-moctar-1429b9199) to automate facial attendance and smart student tracking.

---
