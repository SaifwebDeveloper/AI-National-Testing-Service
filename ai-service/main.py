from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import shutil
import re
from datetime import datetime
from typing import List
import json

app = FastAPI(title="AI Service for Exam Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

# Import PDF and DOCX processors
try:
    import PyPDF2
    import docx
except ImportError:
    print("Please install: pip install PyPDF2 python-docx")

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(file_path)
        text_lines = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_lines.append(paragraph.text.strip())
        return "\n".join(text_lines)
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""

def extract_mcqs_from_text(text: str) -> List[dict]:
    """Extract ALL multiple choice questions from text"""
    questions = []
    
    if not text or len(text.strip()) == 0:
        return questions
    
    print(f"Processing text length: {len(text)} characters")
    
    # Method 1: Split by numbered questions (1., 2., 3., etc.)
    lines = text.split('\n')
    
    current_question = None
    current_options = []
    in_question = False
    
    for line in lines:
        line = line.strip()
        if not line:
            # Empty line might separate questions
            if current_question and len(current_options) >= 2:
                questions.append({
                    "text": current_question,
                    "options": current_options.copy(),
                    "correctAnswer": 0,
                    "marks": 1,
                    "explanation": ""
                })
                current_question = None
                current_options = []
                in_question = False
            continue
        
        # Check if line starts a new question (format: "1. Question text" or "1) Question text")
        question_match = re.match(r'^(\d+)[\.\)]\s*(.+)$', line)
        if question_match:
            # Save previous question
            if current_question and len(current_options) >= 2:
                questions.append({
                    "text": current_question,
                    "options": current_options.copy(),
                    "correctAnswer": 0,
                    "marks": 1,
                    "explanation": ""
                })
            # Start new question
            current_question = question_match.group(2).strip()
            current_options = []
            in_question = True
            continue
        
        # Also check for bold numbered questions like "**1. Question text**"
        bold_question_match = re.match(r'\*\*(\d+)[\.\)]\s*(.+)\*\*', line)
        if bold_question_match:
            if current_question and len(current_options) >= 2:
                questions.append({
                    "text": current_question,
                    "options": current_options.copy(),
                    "correctAnswer": 0,
                    "marks": 1,
                    "explanation": ""
                })
            current_question = bold_question_match.group(2).strip()
            current_options = []
            in_question = True
            continue
        
        # If we're in a question and line looks like an option (A) text or A. text or A text)
        if in_question:
            # Check for option patterns
            option_match = re.match(r'^([A-D])[\.\)]\s*(.+)$', line, re.IGNORECASE)
            if not option_match:
                option_match = re.match(r'^([A-D])\s+(.+)$', line, re.IGNORECASE)
            
            if option_match:
                option_text = option_match.group(2).strip()
                # Remove bold markers if any
                option_text = option_text.replace('**', '').strip()
                current_options.append(option_text)
                continue
            
            # Also check for options without letter prefix (just text on new line)
            # This handles your document format where options are on separate lines without A, B, C, D
            if len(line) > 1 and not re.match(r'^\d+', line):
                # Clean the option text
                clean_line = line.replace('**', '').strip()
                if len(clean_line) > 1:
                    current_options.append(clean_line)
    
    # Don't forget the last question
    if current_question and len(current_options) >= 2:
        questions.append({
            "text": current_question,
            "options": current_options.copy(),
            "correctAnswer": 0,
            "marks": 1,
            "explanation": ""
        })
    
    print(f"Extracted {len(questions)} questions")
    
    # Method 2: If no questions found with pattern matching, try answer key approach
    if len(questions) == 0:
        questions = extract_by_answer_key(text)
    
    return questions

def extract_by_answer_key(text: str) -> List[dict]:
    """Extract questions by looking for question-answer patterns"""
    questions = []
    
    # Find all lines that look like questions (end with ?)
    lines = text.split('\n')
    current_question = None
    current_options = []
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_question and len(current_options) >= 2:
                questions.append({
                    "text": current_question,
                    "options": current_options.copy(),
                    "correctAnswer": 0,
                    "marks": 1,
                    "explanation": ""
                })
                current_question = None
                current_options = []
            continue
        
        # Check if line is a question (ends with ?)
        if '?' in line:
            if current_question and len(current_options) >= 2:
                questions.append({
                    "text": current_question,
                    "options": current_options.copy(),
                    "correctAnswer": 0,
                    "marks": 1,
                    "explanation": ""
                })
            # Clean the question
            clean_question = re.sub(r'^\d+[\.\)]\s*', '', line)
            clean_question = clean_question.replace('**', '').strip()
            current_question = clean_question
            current_options = []
        elif current_question:
            # This is likely an option
            clean_option = line.replace('**', '').strip()
            # Remove option prefixes if present
            clean_option = re.sub(r'^[A-D][\.\)]\s*', '', clean_option, flags=re.IGNORECASE)
            clean_option = re.sub(r'^[A-D]\s+', '', clean_option, flags=re.IGNORECASE)
            if clean_option and len(clean_option) > 1:
                current_options.append(clean_option)
    
    # Add last question
    if current_question and len(current_options) >= 2:
        questions.append({
            "text": current_question,
            "options": current_options.copy(),
            "correctAnswer": 0,
            "marks": 1,
            "explanation": ""
        })
    
    return questions

@app.get("/")
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/extract-questions")
async def extract_questions(
    file: UploadFile = File(...),
    total_marks: int = Form(50)
):
    """Extract multiple choice questions from uploaded document"""
    try:
        temp_path = f"uploads/{datetime.now().timestamp()}_{file.filename}"
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"\n=== Processing: {file.filename} ===")
        
        text = ""
        if file.filename.endswith('.pdf'):
            # Add PDF extraction here if needed
            pass
        elif file.filename.endswith('.docx'):
            text = extract_text_from_docx(temp_path)
        else:
            os.remove(temp_path)
            return JSONResponse(status_code=400, content={"success": False, "message": "Unsupported file format"})
        
        os.remove(temp_path)
        
        if not text or len(text.strip()) == 0:
            return JSONResponse(status_code=200, content={
                "success": False,
                "message": "Could not extract text from document",
                "questions": [],
                "totalQuestions": 0
            })
        
        print(f"Extracted text length: {len(text)} characters")
        print(f"First 1000 chars:\n{text[:1000]}\n")
        
        questions = extract_mcqs_from_text(text)
        
        print(f"Final: Extracted {len(questions)} questions")
        
        if len(questions) == 0:
            return JSONResponse(status_code=200, content={
                "success": False,
                "message": "No questions could be identified. Please ensure your document has numbered questions (1., 2., etc.) with options on separate lines.",
                "questions": [],
                "totalQuestions": 0
            })
        
        return {
            "success": True,
            "questions": questions,
            "totalQuestions": len(questions),
            "extractedTextPreview": text[:500],
            "message": f"Successfully extracted {len(questions)} questions from the document"
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)