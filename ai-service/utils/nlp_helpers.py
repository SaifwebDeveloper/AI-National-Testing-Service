import re
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter

class NLPHelpers:
    """Natural Language Processing helper utilities"""
    
    def __init__(self):
        self.questions_words = {
            'what', 'where', 'when', 'why', 'how', 'which', 'who', 'whom',
            'describe', 'explain', 'define', 'list', 'compare', 'contrast',
            'analyze', 'evaluate', 'discuss', 'summarize'
        }
    
    def extract_important_sentences(self, text: str, num_sentences: int = 5) -> List[str]:
        """
        Extract the most important sentences from text using basic heuristics
        
        Args:
            text: Input text
            num_sentences: Number of sentences to extract
            
        Returns:
            List of important sentences
        """
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        if not sentences:
            return []
        
        # Score each sentence
        word_freq = self._get_word_frequencies(text)
        sentence_scores = []
        
        for sentence in sentences:
            score = 0
            words = sentence.lower().split()
            
            # Score based on word frequency
            for word in words:
                if word in word_freq:
                    score += word_freq[word]
            
            # Bonus for sentences with question words
            if any(q_word in sentence.lower() for q_word in self.questions_words):
                score *= 1.5
            
            # Bonus for longer sentences
            score += len(words) * 0.1
            
            sentence_scores.append((sentence, score))
        
        # Sort by score and get top sentences
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [s for s, _ in sentence_scores[:num_sentences]]
    
    def _get_word_frequencies(self, text: str) -> Dict[str, float]:
        """
        Calculate normalized word frequencies
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of word frequencies
        """
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        word_count = len(words)
        
        if word_count == 0:
            return {}
        
        freq = Counter(words)
        
        # Normalize frequencies
        return {word: count / word_count for word, count in freq.items()}
    
    def generate_question_stems(self, text: str) -> List[str]:
        """
        Generate potential question stems from text
        
        Args:
            text: Input text
            
        Returns:
            List of question stems
        """
        important_sentences = self.extract_important_sentences(text, 10)
        question_stems = []
        
        for sentence in important_sentences:
            # Generate different types of questions
            stems = self._create_question_stems(sentence)
            question_stems.extend(stems)
        
        # Remove duplicates and limit
        return list(dict.fromkeys(question_stems))[:20]
    
    def _create_question_stems(self, sentence: str) -> List[str]:
        """
        Create question stems from a sentence
        
        Args:
            sentence: Input sentence
            
        Returns:
            List of question stems
        """
        stems = []
        sentence_lower = sentence.lower()
        
        # What questions
        if 'is' in sentence_lower or 'are' in sentence_lower:
            stems.append(f"What is {sentence}?")
        
        # Why questions
        if 'because' in sentence_lower or 'due to' in sentence_lower:
            stems.append(f"Why {sentence}?")
        
        # How questions
        if 'can' in sentence_lower or 'could' in sentence_lower:
            stems.append(f"How can {sentence}?")
        
        # Define questions
        if len(sentence.split()) < 20:  # Short sentences make good definition questions
            key_terms = self.extract_key_terms(sentence, 3)
            for term in key_terms:
                stems.append(f"Define {term}.")
        
        return stems
    
    def extract_key_terms(self, text: str, top_n: int = 10) -> List[str]:
        """
        Extract key terms from text
        
        Args:
            text: Input text
            top_n: Number of terms to extract
            
        Returns:
            List of key terms
        """
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing'
        }
        
        words = re.findall(r'\b[A-Z][a-z]+\b', text)  # Capitalized words are often important
        words += re.findall(r'\b[a-z]{5,}\b', text)  # Long words
        
        # Filter stop words and count frequencies
        filtered_words = [w.lower() for w in words if w.lower() not in stop_words and len(w) > 3]
        word_freq = Counter(filtered_words)
        
        # Get top terms
        return [word for word, _ in word_freq.most_common(top_n)]
    
    def check_similarity(self, text1: str, text2: str) -> float:
        """
        Check similarity between two texts (simplified)
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        # Convert to lowercase and extract words
        words1 = set(re.findall(r'\b[a-z]+\b', text1.lower()))
        words2 = set(re.findall(r'\b[a-z]+\b', text2.lower()))
        
        if not words1 or not words2:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def extract_statements(self, text: str) -> List[str]:
        """
        Extract factual statements from text
        
        Args:
            text: Input text
            
        Returns:
            List of factual statements
        """
        sentences = re.split(r'[.!?]+', text)
        statements = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 10 or len(sentence) > 200:
                continue
            
            # Check if sentence contains factual indicators
            factual_indicators = [
                'is', 'are', 'was', 'were', 'has', 'have', 'consists of',
                'refers to', 'means', 'defined as', 'called', 'known as'
            ]
            
            if any(indicator in sentence.lower() for indicator in factual_indicators):
                statements.append(sentence)
        
        return statements
    
    def generate_mcq_options(self, text: str, correct_answer: str, num_options: int = 3) -> List[str]:
        """
        Generate distractors for multiple choice questions
        
        Args:
            text: Context text
            correct_answer: The correct answer
            num_options: Number of distractor options to generate
            
        Returns:
            List of distractor options
        """
        # Extract key terms from text
        key_terms = self.extract_key_terms(text, 20)
        
        # Remove the correct answer if present
        distractors = [term for term in key_terms if term.lower() != correct_answer.lower()]
        
        # Return top distractors
        return distractors[:num_options]
    
    def get_reading_difficulty(self, text: str) -> Dict[str, Any]:
        """
        Calculate reading difficulty metrics
        
        Args:
            text: Input text
            
        Returns:
            Dictionary with difficulty metrics
        """
        sentences = re.split(r'[.!?]+', text)
        words = re.findall(r'\b[a-zA-Z]+\b', text)
        
        if not sentences or not words:
            return {"level": "unknown", "score": 0}
        
        # Average sentence length
        avg_sentence_length = len(words) / len(sentences)
        
        # Average word length
        avg_word_length = sum(len(w) for w in words) / len(words)
        
        # Flesch Reading Ease (simplified)
        flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_word_length)
        
        # Determine difficulty level
        if flesch_score >= 80:
            level = "Very Easy"
        elif flesch_score >= 70:
            level = "Easy"
        elif flesch_score >= 60:
            level = "Standard"
        elif flesch_score >= 50:
            level = "Moderately Difficult"
        elif flesch_score >= 30:
            level = "Difficult"
        else:
            level = "Very Difficult"
        
        return {
            "level": level,
            "score": round(flesch_score, 2),
            "avg_sentence_length": round(avg_sentence_length, 1),
            "avg_word_length": round(avg_word_length, 1),
            "total_sentences": len(sentences),
            "total_words": len(words)
        }