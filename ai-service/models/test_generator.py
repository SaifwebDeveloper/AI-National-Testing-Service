import openai
import json
import re
from typing import List, Dict, Any
import os
from .pdf_processor import PDFProcessor

class TestGenerator:
    def __init__(self):
        # Initialize OpenAI (you'll need to set your API key)
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
        self.pdf_processor = PDFProcessor()
        
    async def generate_questions(
        self, 
        text: str, 
        num_questions: int = 10,
        subject: str = "General",
        difficulty: str = "medium"
    ) -> List[Dict[str, Any]]:
        """Generate multiple choice questions from text using AI"""
        
        # First try to extract questions from text
        extracted_questions = self.pdf_processor.extract_mcqs(text)
        
        if extracted_questions and len(extracted_questions) >= num_questions:
            # Return extracted questions if enough found
            return extracted_questions[:num_questions]
        
        if extracted_questions:
            # Use extracted questions as base and generate more
            questions = extracted_questions
            remaining = num_questions - len(questions)
        else:
            questions = []
            remaining = num_questions
        
        # Generate additional questions using AI if API key is available
        if self.openai_api_key and remaining > 0:
            try:
                ai_questions = await self._generate_with_ai(text, remaining, subject, difficulty)
                questions.extend(ai_questions)
            except Exception as e:
                print(f"AI generation error: {e}")
                questions.extend(self._generate_mock_questions(remaining, subject))
        else:
            # Generate mock questions if no API key
            questions.extend(self._generate_mock_questions(remaining, subject))
        
        return questions[:num_questions]
    
    async def _generate_with_ai(
        self, 
        text: str, 
        num_questions: int,
        subject: str,
        difficulty: str
    ) -> List[Dict[str, Any]]:
        """Generate questions using OpenAI API"""
        try:
            prompt = f"""
            Based on the following text about {subject}, generate {num_questions} multiple choice questions.
            Difficulty level: {difficulty}
            
            Text: {text[:3000]}  # Limit text length
            
            Format each question as a JSON object with exactly these fields:
            {{
                "text": "The question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Brief explanation of the correct answer",
                "marks": 1
            }}
            
            Return ONLY a JSON array of questions, no other text.
            """
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert test generator. Generate high-quality multiple choice questions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            # Clean the response
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            
            questions = json.loads(content)
            return questions
            
        except Exception as e:
            print(f"OpenAI error: {e}")
            return self._generate_mock_questions(num_questions, subject)
    
    def _generate_mock_questions(self, num_questions: int, subject: str) -> List[Dict[str, Any]]:
        """Generate mock questions for testing"""
        questions = []
        
        # Subject-specific templates
        templates = {
            "Mathematics": [
                {
                    "text": "What is the value of π (pi) approximately?",
                    "options": ["3.14", "2.71", "1.62", "4.21"],
                    "correctAnswer": 0,
                    "explanation": "π is approximately 3.14159",
                    "marks": 1
                },
                {
                    "text": "What is the square root of 144?",
                    "options": ["10", "11", "12", "13"],
                    "correctAnswer": 2,
                    "explanation": "12 × 12 = 144",
                    "marks": 1
                },
                {
                    "text": "What is 25% of 200?",
                    "options": ["25", "50", "75", "100"],
                    "correctAnswer": 1,
                    "explanation": "25% of 200 = 200 × 0.25 = 50",
                    "marks": 1
                }
            ],
            "Physics": [
                {
                    "text": "What is Newton's first law also known as?",
                    "options": ["Law of Inertia", "Law of Acceleration", "Law of Action-Reaction", "Law of Gravity"],
                    "correctAnswer": 0,
                    "explanation": "Newton's first law is the Law of Inertia",
                    "marks": 1
                }
            ],
            "General": [
                {
                    "text": "What is the capital of Pakistan?",
                    "options": ["Karachi", "Lahore", "Islamabad", "Rawalpindi"],
                    "correctAnswer": 2,
                    "explanation": "Islamabad is the capital of Pakistan",
                    "marks": 1
                }
            ]
        }
        
        template_list = templates.get(subject, templates["General"])
        
        # Use templates
        for i in range(min(num_questions, len(template_list))):
            questions.append(template_list[i % len(template_list)])
        
        # Add generic questions if needed
        while len(questions) < num_questions:
            questions.append({
                "text": f"Sample Question {len(questions) + 1}: This question is about {subject}.",
                "options": ["Option A (Correct)", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "This is a sample explanation. In a real test, this would explain the correct answer.",
                "marks": 1
            })
        
        return questions
    
    async def analyze_answer(
        self,
        question: str,
        student_answer: str,
        model_answer: str
    ) -> Dict[str, Any]:
        """Analyze student answer and provide score"""
        
        if not self.openai_api_key:
            # Simple keyword matching for mock
            similarity = self._calculate_similarity(student_answer, model_answer)
            score = similarity
            feedback = "Answer analyzed successfully" if score > 0.7 else "Answer needs improvement"
            return {
                "score": score,
                "feedback": feedback,
                "confidence": 0.8
            }
        
        try:
            prompt = f"""
            Question: {question}
            Student Answer: {student_answer}
            Model Answer: {model_answer}
            
            Score the student answer from 0 to 1, where 1 is perfect.
            Provide constructive feedback on the answer.
            
            Return as JSON: {{"score": 0.8, "feedback": "Your feedback here"}}
            """
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an answer evaluator. Be fair and constructive."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            content = content.strip()
            
            # Clean response
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            
            result = json.loads(content)
            return result
            
        except Exception as e:
            print(f"OpenAI analysis error: {e}")
            similarity = self._calculate_similarity(student_answer, model_answer)
            return {
                "score": similarity,
                "feedback": "Unable to analyze fully using AI. Score based on keyword matching.",
                "confidence": 0.5
            }
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using keyword matching"""
        words1 = set(re.findall(r'\b\w+\b', text1.lower()))
        words2 = set(re.findall(r'\b\w+\b', text2.lower()))
        
        if not words1 or not words2:
            return 0.5
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.5
    
    def extract_questions_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Extract questions from text using the PDF processor"""
        return self.pdf_processor.extract_mcqs(text)