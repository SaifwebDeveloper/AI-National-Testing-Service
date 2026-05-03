import cv2
import numpy as np
import asyncio
import json
import websockets
import base64
from datetime import datetime
from ultralytics import YOLO


class WebcamProctor:
    def __init__(self):
        self.violations = {}
        self.prev_frame = None

        # OpenCV models
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye.xml"
        )

        # YOLO model (IMPORTANT)
        self.model = YOLO("yolov8n.pt")

        print("✓ Proctoring system initialized")

    # ---------------- IMAGE DECODE ----------------
    def decode_image(self, base64_string):
        try:
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]

            img = base64.b64decode(base64_string)
            np_arr = np.frombuffer(img, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            return frame
        except:
            return None

    # ---------------- OPENCV DETECTIONS ----------------
    def detect_faces(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return self.face_cascade.detectMultiScale(gray, 1.1, 5)

    def detect_eyes(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return self.eye_cascade.detectMultiScale(gray, 1.1, 5)

    def detect_motion(self, frame):
        if self.prev_frame is None:
            self.prev_frame = frame
            return False, 0

        prev = cv2.cvtColor(self.prev_frame, cv2.COLOR_BGR2GRAY)
        curr = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        diff = cv2.absdiff(prev, curr)
        score = np.sum(diff) / 255

        self.prev_frame = frame
        return score > 30000, score

    def check_lighting(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        return brightness > 50, brightness

    # ---------------- YOLO OBJECT DETECTION ----------------
    def detect_objects(self, frame):
        frame = cv2.resize(frame, (640, 480))

        results = self.model(frame, verbose=False)

        persons = 0
        mobiles = 0

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                label = self.model.names[cls]

                if label == "person":
                    persons += 1

                if label == "cell phone":
                    mobiles += 1

        return persons, mobiles

    # ---------------- ANALYSIS ENGINE ----------------
    def analyze_frame(self, frame, session_id):
        violations = []
        warnings = []

        if frame is None:
            return self._empty_response(session_id)

        faces = self.detect_faces(frame)
        eyes = self.detect_eyes(frame)
        motion, _ = self.detect_motion(frame)
        lighting, brightness = self.check_lighting(frame)

        persons, mobiles = self.detect_objects(frame)

        if session_id not in self.violations:
            self.violations[session_id] = 0

        # ---------- FACE ----------
        if len(faces) == 0:
            warnings.append({"type": "no_face"})
        elif len(faces) > 1:
            violations.append({"type": "multiple_faces"})
            self.violations[session_id] += 1

        # ---------- EYES ----------
        if len(eyes) < 2:
            warnings.append({"type": "eyes_not_visible"})

        # ---------- MULTI PERSON ----------
        if persons > 1:
            violations.append({
                "type": "multiple_persons",
                "message": f"{persons} persons detected"
            })
            self.violations[session_id] += 1

        # ---------- MOBILE ----------
        if mobiles > 0:
            violations.append({
                "type": "mobile_detected",
                "message": "Mobile phone detected"
            })
            self.violations[session_id] += 1

        # ---------- LIGHTING ----------
        if not lighting:
            warnings.append({"type": "poor_lighting"})

        # ---------- MOTION ----------
        if motion:
            warnings.append({"type": "excessive_motion"})

        total = self.violations[session_id]

        return {
            "has_violations": len(violations) > 0,
            "has_warnings": len(warnings) > 0,
            "violations": violations,
            "warnings": warnings,
            "total_violations": total,
            "can_continue": total < 3,
            "face_detected": len(faces) > 0,
            "face_count": len(faces),
            "eye_count": len(eyes),
            "persons": persons,
            "mobiles": mobiles,
            "brightness": int(brightness)
        }

    def _empty_response(self, session_id):
        return {
            "has_violations": False,
            "has_warnings": True,
            "violations": [],
            "warnings": [{"type": "no_frame"}],
            "total_violations": self.violations.get(session_id, 0),
            "can_continue": True,
            "face_detected": False
        }


# ---------------- WEBSOCKET SERVER ----------------
async def handler(websocket):
    proctor = WebcamProctor()
    session_id = None

    print("[+] Client connected")

    try:
        async for message in websocket:
            data = json.loads(message)

            # INIT
            if data["type"] == "init":
                session_id = data.get("session_id", str(id(websocket)))

                if session_id not in proctor.violations:
                    proctor.violations[session_id] = 0

                await websocket.send(json.dumps({
                    "type": "init_ack",
                    "status": "ready"
                }))

            # FRAME
            elif data["type"] == "frame":
                frame = proctor.decode_image(data["image"])
                result = proctor.analyze_frame(frame, session_id)

                await websocket.send(json.dumps({
                    "type": "analysis",
                    **result
                }))

                if not result["can_continue"]:
                    await websocket.send(json.dumps({
                        "type": "terminate",
                        "reason": "too_many_violations"
                    }))

            elif data["type"] == "ping":
                await websocket.send(json.dumps({"type": "pong"}))

    except websockets.exceptions.ConnectionClosed:
        print("[-] Client disconnected")
    except Exception as e:
        print("[ERROR]", e)


# ---------------- START SERVER ----------------
async def main():
    print("\n=================================")
    print("🚀 AI Proctoring Server Running")
    print("=================================\n")

    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("📡 ws://localhost:8765")
        print("✅ Waiting for connections...\n")
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped")