import cv2
import numpy as np
from typing import Dict, Any
import os

class CheatingDetector:
    def __init__(self):
        # Load pre-trained face detection model
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
    
    async def analyze_frame(self, image_path: str) -> Dict[str, Any]:
        """Analyze a single frame for cheating indicators"""
        result = {
            "hasCheating": False,
            "violations": [],
            "facesDetected": 0,
            "phoneDetected": False,
            "confidence": 0.0
        }
        
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return result
            
            # Detect faces
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            result["facesDetected"] = len(faces)
            
            # Check for multiple faces
            if len(faces) > 1:
                result["hasCheating"] = True
                result["violations"].append("multiple_persons")
            
            # Check for phone (simplified - would need trained model)
            phone_detected = self._detect_phone(img)
            if phone_detected:
                result["hasCheating"] = True
                result["violations"].append("phone_detected")
                result["phoneDetected"] = True
            
            # Check if face is visible
            if len(faces) == 0:
                result["violations"].append("face_not_visible")
            
            result["confidence"] = 0.8 if result["hasCheating"] else 0.9
            
        except Exception as e:
            print(f"Frame analysis error: {e}")
        
        return result
    
    async def detect_multiple_faces(self, image_path: str) -> Dict[str, Any]:
        """Detect if multiple faces are present"""
        result = {
            "multipleFaces": False,
            "faceCount": 0,
            "confidence": 0.0
        }
        
        try:
            img = cv2.imread(image_path)
            if img is not None:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
                
                result["faceCount"] = len(faces)
                result["multipleFaces"] = len(faces) > 1
                result["confidence"] = 0.9 if len(faces) > 1 else 0.8
                
        except Exception as e:
            print(f"Face detection error: {e}")
        
        return result
    
    async def detect_phone(self, image_path: str) -> Dict[str, Any]:
        """Detect if mobile phone is present"""
        # This is a simplified version
        # In production, use a trained object detection model
        
        result = {
            "phoneDetected": False,
            "confidence": 0.0,
            "boundingBox": None
        }
        
        # Placeholder - actual implementation would use a model
        # like YOLO or MobileNet for phone detection
        
        return result
    
    def _detect_phone(self, image) -> bool:
        """Helper method to detect phone in image"""
        # Simplified phone detection
        # In production, use a proper object detection model
        
        # Get image dimensions
        height, width = image.shape[:2]
        
        # Look for rectangular shapes that might be phones
        # This is a placeholder - actual implementation would use ML
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            approx = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
            if len(approx) == 4:  # Rectangle shape
                area = cv2.contourArea(contour)
                # Phone-like area ratio
                if 0.01 < area / (width * height) < 0.2:
                    return True
        
        return False
    
    def check_eye_contact(self, image_path: str) -> Dict[str, Any]:
        """Check if student is maintaining eye contact"""
        result = {
            "eyeContact": False,
            "lookingAway": False,
            "confidence": 0.0
        }
        
        try:
            img = cv2.imread(image_path)
            if img is not None:
                # Simplified eye detection
                # In production, use eye detection models
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
                
                if len(faces) > 0:
                    result["eyeContact"] = True
                    result["confidence"] = 0.7
                
        except Exception as e:
            print(f"Eye contact detection error: {e}")
        
        return result