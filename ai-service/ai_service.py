import cv2
import numpy as np
import asyncio
import json
import websockets
import base64
from datetime import datetime

class WebcamProctor:
    def __init__(self):
        self.violations = {}
        self.prev_frame = None

        try:
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            self.eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml'
            )
            print("✓ Face detection initialized successfully")
        except Exception as e:
            print(f"Warning: Could not load cascade: {e}")
            self.face_cascade = None
            self.eye_cascade = None

        print("WebcamProctor initialized with OpenCV detection")

    def decode_image(self, base64_string):
        try:
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]

            image_data = base64.b64decode(base64_string)
            np_arr = np.frombuffer(image_data, np.uint8)
            return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None

    def detect_faces(self, frame):
        if self.face_cascade is None:
            return []
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return self.face_cascade.detectMultiScale(gray, 1.1, 5)

    def detect_eyes(self, frame):
        if self.eye_cascade is None:
            return []
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return self.eye_cascade.detectMultiScale(gray, 1.1, 5)

    def detect_motion(self, frame):
        if self.prev_frame is None:
            self.prev_frame = frame.copy()
            return False, 0

        prev_gray = cv2.cvtColor(self.prev_frame, cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        diff = cv2.absdiff(prev_gray, curr_gray)
        motion_amount = np.sum(diff) / 255

        self.prev_frame = frame.copy()

        return motion_amount > 30000, motion_amount

    def check_lighting(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        return brightness > 50, brightness

    def analyze_frame(self, frame, session_id):
        violations = []
        warnings = []

        if frame is None:
            return {
                'has_violations': False,
                'has_warnings': True,
                'violations': [],
                'warnings': [{'type': 'no_frame'}],
                'total_violations': self.violations.get(session_id, 0),
                'can_continue': True,
                'face_detected': False
            }

        faces = self.detect_faces(frame)
        eyes = self.detect_eyes(frame)

        good_lighting, brightness = self.check_lighting(frame)
        has_motion, motion_amount = self.detect_motion(frame)

        if session_id not in self.violations:
            self.violations[session_id] = 0

        # Face rules
        if len(faces) == 0:
            warnings.append({'type': 'no_face'})
        elif len(faces) > 1:
            violations.append({'type': 'multiple_faces'})
            self.violations[session_id] += 1
        else:
            if len(eyes) < 2:
                warnings.append({'type': 'eyes_not_visible'})

        # Lighting
        if not good_lighting:
            warnings.append({'type': 'poor_lighting'})

        # Motion
        if has_motion and motion_amount > 50000:
            warnings.append({'type': 'excessive_motion'})

        return {
            'has_violations': len(violations) > 0,
            'has_warnings': len(warnings) > 0,
            'violations': violations,
            'warnings': warnings,
            'total_violations': self.violations[session_id],
            'can_continue': self.violations[session_id] < 3,
            'face_detected': len(faces) > 0,
            'face_count': len(faces),
            'eye_count': len(eyes),
            'brightness': int(brightness)
        }


# ✅ FIXED HANDLER (NO PATH)
async def handler(websocket):
    proctor = WebcamProctor()
    session_id = None
    active_sessions = {}

    print("[+] New connection established")

    try:
        async for message in websocket:
            data = json.loads(message)

            if data['type'] == 'init':
                session_id = data.get('session_id', str(id(websocket)))
                active_sessions[session_id] = {
                    'start_time': datetime.now(),
                    'frame_count': 0
                }

                await websocket.send(json.dumps({
                    'type': 'init_ack',
                    'status': 'ready'
                }))

            elif data['type'] == 'frame':
                if not session_id:
                    continue

                active_sessions[session_id]['frame_count'] += 1

                frame = proctor.decode_image(data['image'])
                analysis = proctor.analyze_frame(frame, session_id)

                await websocket.send(json.dumps({
                    'type': 'analysis',
                    **analysis
                }))

                if not analysis['can_continue']:
                    await websocket.send(json.dumps({
                        'type': 'terminate',
                        'reason': 'violations'
                    }))

            elif data['type'] == 'ping':
                await websocket.send(json.dumps({'type': 'pong'}))

    except websockets.exceptions.ConnectionClosed:
        print(f"[-] Connection closed: {session_id}")
    except Exception as e:
        print(f"[!] Error: {e}")


async def main():
    print("\n" + "="*50)
    print("🚀 Proctoring Server Starting")
    print("="*50)

    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("📡 ws://localhost:8765")
        print("✅ Waiting for connections...\n")
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped")