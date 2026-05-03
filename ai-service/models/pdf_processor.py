import PyPDF2
import docx
import re
from typing import Dict, Any, List

class PDFProcessor:
    def __init__(self):
        pass
    
    def extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file preserving structure"""
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
    
    def extract_mcqs(self, text: str) -> List[Dict[str, Any]]:
        """Extract multiple choice questions"""
        questions = []
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
            
            # Check for numbered question
            question_match = re.match(r'^(\d+)[\.\)]\s*(.+)$', line)
            if question_match:
                if current_question and len(current_options) >= 2:
                    questions.append({
                        "text": current_question,
                        "options": current_options.copy(),
                        "correctAnswer": 0,
                        "marks": 1,
                        "explanation": ""
                    })
                current_question = question_match.group(2).strip()
                current_options = []
                continue
            
            # Check for options (A, B, C, D)
            option_match = re.match(r'^([A-D])[\.\)]\s*(.+)$', line, re.IGNORECASE)
            if option_match and current_question:
                option_text = option_match.group(2).strip()
                current_options.append(option_text)
                continue
            
            # Also capture lines without prefixes (just text)
            if current_question and not option_match and len(line) > 1:
                current_options.append(line)
        
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