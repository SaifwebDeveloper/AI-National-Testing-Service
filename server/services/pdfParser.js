const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const pdfParse = require('pdf-parse');

// Parse PDF file and extract text
const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    return {
      success: true,
      text: data.text,
      metadata: {
        title: data.info?.Title || null,
        author: data.info?.Author || null,
        subject: data.info?.Subject || null,
        keywords: data.info?.Keywords || null,
        pageCount: data.numpages,
        version: data.version
      }
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Parse DOCX file (using external library or command line)
const parseDOCX = async (filePath) => {
  try {
    // Try using python-docx via command line if available
    const pythonScript = `
import sys
import docx

def extract_text(docx_path):
    doc = docx.Document(docx_path)
    text = []
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            text.append(paragraph.text)
    return '\\n'.join(text)

if __name__ == '__main__':
    print(extract_text(sys.argv[1]))
`;
    
    const scriptPath = path.join(__dirname, '../temp/extract_docx.py');
    fs.writeFileSync(scriptPath, pythonScript);
    
    const { stdout, stderr } = await exec(`python ${scriptPath} "${filePath}"`);
    
    // Clean up temp file
    fs.unlinkSync(scriptPath);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    return {
      success: true,
      text: stdout,
      metadata: {
        pageCount: 1,
        format: 'docx'
      }
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Parse text file
const parseTXT = async (filePath) => {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return {
      success: true,
      text: text,
      metadata: {
        size: fs.statSync(filePath).size,
        lines: text.split('\n').length
      }
    };
  } catch (error) {
    console.error('TXT parsing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Extract questions from parsed text
const extractQuestionsFromText = (text) => {
  const questions = [];
  
  // Split text into lines
  const lines = text.split('\n');
  
  let currentQuestion = null;
  let currentOptions = [];
  let readingOptions = false;
  
  // Pattern for question numbers (1., 1), 1- etc.)
  const questionPattern = /^(\d+)[\.\)\-]\s+(.+)$/i;
  
  // Pattern for options (A., A), A- etc.)
  const optionPattern = /^([A-D])[\.\)\-]\s+(.+)$/i;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check if line starts a new question
    const questionMatch = trimmedLine.match(questionPattern);
    if (questionMatch && !readingOptions) {
      // Save previous question
      if (currentQuestion) {
        questions.push({
          text: currentQuestion,
          options: currentOptions,
          hasOptions: currentOptions.length > 0
        });
        currentOptions = [];
      }
      
      // Start new question
      currentQuestion = questionMatch[2];
      readingOptions = true;
      continue;
    }
    
    // Check for options
    const optionMatch = trimmedLine.match(optionPattern);
    if (optionMatch && readingOptions) {
      currentOptions.push({
        letter: optionMatch[1],
        text: optionMatch[2]
      });
      continue;
    }
    
    // If not a question or option, append to current question
    if (currentQuestion && readingOptions && !optionMatch) {
      currentQuestion += ' ' + trimmedLine;
    }
  }
  
  // Add last question
  if (currentQuestion) {
    questions.push({
      text: currentQuestion,
      options: currentOptions,
      hasOptions: currentOptions.length > 0
    });
  }
  
  return questions;
};

// Identify potential MCQs from text
const identifyMCQs = (text) => {
  const mcqs = [];
  const questions = extractQuestionsFromText(text);
  
  for (const question of questions) {
    if (question.options.length >= 2) {
      // Determine correct answer (if indicated)
      let correctAnswer = null;
      for (let i = 0; i < question.options.length; i++) {
        const option = question.options[i];
        // Look for indicators like "(Correct)", "✓", "*", etc.
        if (option.text.includes('(Correct)') || 
            option.text.includes('✓') || 
            option.text.includes('*') ||
            option.text.toUpperCase().includes('ANSWER')) {
          correctAnswer = i;
          // Clean the option text
          option.text = option.text.replace(/\(Correct\)|✓|\*/g, '').trim();
          break;
        }
      }
      
      mcqs.push({
        text: question.text,
        options: question.options.map(opt => opt.text),
        correctAnswer: correctAnswer,
        hasCorrectAnswer: correctAnswer !== null
      });
    }
  }
  
  return mcqs;
};

// Extract key terms and concepts for question generation
const extractKeyTerms = (text) => {
  // Simple keyword extraction (can be enhanced with NLP)
  const words = text.toLowerCase().split(/\W+/);
  const wordFrequency = {};
  
  // Stop words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing'
  ]);
  
  for (const word of words) {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  }
  
  // Get top 20 keywords
  const keywords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
  
  return keywords;
};

// Get document summary
const getDocumentSummary = async (filePath, fileType) => {
  let parseResult;
  
  switch (fileType.toLowerCase()) {
    case 'pdf':
      parseResult = await parsePDF(filePath);
      break;
    case 'docx':
      parseResult = await parseDOCX(filePath);
      break;
    case 'txt':
      parseResult = await parseTXT(filePath);
      break;
    default:
      return {
        success: false,
        error: 'Unsupported file type'
      };
  }
  
  if (!parseResult.success) {
    return parseResult;
  }
  
  const text = parseResult.text;
  const mcqs = identifyMCQs(text);
  const keywords = extractKeyTerms(text);
  
  return {
    success: true,
    summary: {
      totalWords: text.split(/\s+/).length,
      totalCharacters: text.length,
      totalLines: text.split('\n').length,
      potentialMCQs: mcqs.length,
      mcqsFound: mcqs.filter(m => m.hasCorrectAnswer).length,
      keyTerms: keywords
    },
    mcqs: mcqs,
    fullText: text,
    metadata: parseResult.metadata
  };
};

// Split text into sections/chapters
const splitIntoSections = (text) => {
  const sections = [];
  
  // Look for common section headers
  const sectionPatterns = [
    /^(Chapter|Section|Part)\s+\d+[\.:]\s+(.+)$/im,
    /^(\d+\.\s+[A-Z][A-Za-z\s]+)$/m,
    /^([A-Z][A-Za-z\s]+:)$/m
  ];
  
  let currentSection = { title: 'Introduction', content: [] };
  const lines = text.split('\n');
  
  for (const line of lines) {
    let isSectionHeader = false;
    
    for (const pattern of sectionPatterns) {
      const match = line.match(pattern);
      if (match) {
        // Save previous section
        if (currentSection.content.length > 0) {
          sections.push({
            title: currentSection.title,
            content: currentSection.content.join('\n')
          });
        }
        
        // Start new section
        currentSection = {
          title: match[2] || match[1] || line,
          content: []
        };
        isSectionHeader = true;
        break;
      }
    }
    
    if (!isSectionHeader && line.trim()) {
      currentSection.content.push(line);
    }
  }
  
  // Add last section
  if (currentSection.content.length > 0) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n')
    });
  }
  
  return sections;
};

module.exports = {
  parsePDF,
  parseDOCX,
  parseTXT,
  extractQuestionsFromText,
  identifyMCQs,
  extractKeyTerms,
  getDocumentSummary,
  splitIntoSections
};