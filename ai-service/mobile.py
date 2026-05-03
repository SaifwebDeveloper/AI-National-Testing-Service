# Mobile Detection with Webcam + Voice Alert
# Install first:
# pip install opencv-python ultralytics pyttsx3

import cv2
import pyttsx3
import time
from ultralytics import YOLO

# Load YOLOv8 model
model = YOLO("yolov8n.pt")   # Auto downloads first time

# Voice Engine
engine = pyttsx3.init()
engine.setProperty('rate', 150)

# Webcam Start
cap = cv2.VideoCapture(0)

# Prevent repeating voice every second
last_alert = 0
alert_delay = 5   # seconds

print("Starting Mobile Detection... Press Q to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Detect objects
    results = model(frame)

    mobile_found = False

    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls = int(box.cls[0])
            label = model.names[cls]

            # COCO dataset uses "cell phone"
            if label == "cell phone":
                mobile_found = True

                # Get box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Draw rectangle
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
                cv2.putText(frame, "Mobile Detected", (x1, y1-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

    # Voice alert
    current_time = time.time()
    if mobile_found and current_time - last_alert > alert_delay:
        engine.say("Mobile is detected")
        engine.runAndWait()
        last_alert = current_time

    # Show webcam
    cv2.imshow("Mobile Detection", frame)

    # Quit with Q
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()