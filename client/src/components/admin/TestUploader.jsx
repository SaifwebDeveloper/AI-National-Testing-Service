import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, Loader, AlertCircle, Sparkles, Eye, Edit2, Save, Trash2 } from 'lucide-react';
import axios from 'axios';

const TestUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [testDetails, setTestDetails] = useState({
    title: '',
    description: '',
    totalMarks: '',
    passingMarks: '',
    duration: '',
    startDate: '',
    endDate: '',
    subject: '',
    difficulty: 'medium'
  });

  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile && (uploadedFile.type === 'application/pdf' || 
        uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setFile(uploadedFile);
      setUploadStatus(null);
      setExtractedQuestions([]);
      setShowQuestions(false);
    } else {
      setUploadStatus({ type: 'error', message: 'Please upload PDF or Word document only' });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleInputChange = (e) => {
    setTestDetails({
      ...testDetails,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!file) return 'Please select a file';
    if (!testDetails.title) return 'Please enter test title';
    if (!testDetails.totalMarks) return 'Please enter total marks';
    if (!testDetails.passingMarks) return 'Please enter passing marks';
    if (!testDetails.duration) return 'Please enter duration';
    if (!testDetails.startDate) return 'Please select start date';
    if (!testDetails.endDate) return 'Please select end date';
    if (new Date(testDetails.startDate) >= new Date(testDetails.endDate)) {
      return 'End date must be after start date';
    }
    return null;
  };

  const handleExtractQuestions = async () => {
    const validationError = validateForm();
    if (validationError) {
      setUploadStatus({ type: 'error', message: validationError });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', testDetails.title);
    formData.append('totalMarks', testDetails.totalMarks);
    formData.append('subject', testDetails.subject);
    formData.append('difficulty', testDetails.difficulty);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/tests/extract-questions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        timeout: 60000
      });
      
      if (response.data.success) {
        setExtractedQuestions(response.data.questions);
        setShowQuestions(true);
        setUploadStatus({ 
          type: 'success', 
          message: `${response.data.questions.length} questions extracted successfully! Review and edit them before saving.` 
        });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: error.response?.data?.message || 'Failed to extract questions' });
    } finally {
      setUploading(false);
    }
  };

  const handleEditQuestion = (index) => {
    setEditingQuestion({ index, ...extractedQuestions[index] });
  };

  const handleSaveEdit = () => {
    const updatedQuestions = [...extractedQuestions];
    updatedQuestions[editingQuestion.index] = {
      text: editingQuestion.text,
      options: editingQuestion.options,
      correctAnswer: editingQuestion.correctAnswer,
      marks: editingQuestion.marks,
      explanation: editingQuestion.explanation
    };
    setExtractedQuestions(updatedQuestions);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = extractedQuestions.filter((_, i) => i !== index);
      setExtractedQuestions(updatedQuestions);
    }
  };

  const handleAddQuestion = () => {
    setExtractedQuestions([
      ...extractedQuestions,
      {
        text: 'New Question',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        marks: 1,
        explanation: 'Add explanation here'
      }
    ]);
  };

  const handleSaveTest = async () => {
    if (extractedQuestions.length === 0) {
      setUploadStatus({ type: 'error', message: 'No questions to save. Please extract questions first.' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', testDetails.title);
    formData.append('description', testDetails.description);
    formData.append('totalMarks', testDetails.totalMarks);
    formData.append('passingMarks', testDetails.passingMarks);
    formData.append('duration', testDetails.duration);
    formData.append('startDate', testDetails.startDate);
    formData.append('endDate', testDetails.endDate);
    formData.append('subject', testDetails.subject);
    formData.append('difficulty', testDetails.difficulty);
    formData.append('questions', JSON.stringify(extractedQuestions));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/tests/upload-with-questions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        timeout: 60000
      });
      
      setUploadStatus({ type: 'success', message: 'Test saved successfully with all questions!' });
      
      // Reset form
      setFile(null);
      setExtractedQuestions([]);
      setShowQuestions(false);
      setTestDetails({
        title: '',
        description: '',
        totalMarks: '',
        passingMarks: '',
        duration: '',
        startDate: '',
        endDate: '',
        subject: '',
        difficulty: 'medium'
      });
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
      
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (error) {
      setUploadStatus({ type: 'error', message: error.response?.data?.message || 'Failed to save test' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <h2 className="text-xl font-bold text-white">Upload Test Document</h2>
          <p className="text-blue-100 text-sm mt-1">Upload PDF or Word document to automatically extract and generate MCQs</p>
        </div>

        <div className="p-6">
          {/* Test Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Title *</label>
              <input
                type="text"
                name="title"
                value={testDetails.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Final Examination 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={testDetails.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics, Physics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={testDetails.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Test description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
              <select
                name="difficulty"
                value={testDetails.difficulty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
              <input
                type="number"
                name="totalMarks"
                value={testDetails.totalMarks}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks *</label>
              <input
                type="number"
                name="passingMarks"
                value={testDetails.passingMarks}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={testDetails.duration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                name="startDate"
                value={testDetails.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
              <input
                type="datetime-local"
                name="endDate"
                value={testDetails.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* File Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            {file ? (
              <div className="flex items-center justify-center space-x-2">
                <FileText className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-600">Drag & drop a PDF or Word document here, or click to select</p>
                <p className="text-sm text-gray-400 mt-2">Supports: .pdf, .docx</p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleExtractQuestions}
              disabled={uploading || !file}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Extracting Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Extract Questions with AI</span>
                </>
              )}
            </button>
            
            {extractedQuestions.length > 0 && (
              <button
                onClick={handleSaveTest}
                disabled={uploading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>Save Test ({extractedQuestions.length} questions)</span>
              </button>
            )}
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
              uploadStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {uploadStatus.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{uploadStatus.message}</span>
            </div>
          )}

          {/* Extracted Questions Section */}
          {showQuestions && extractedQuestions.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Extracted Questions ({extractedQuestions.length})
                </h3>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {extractedQuestions.map((q, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    {editingQuestion && editingQuestion.index === idx ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingQuestion.text}
                          onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                          className="w-full p-2 border rounded font-medium"
                          placeholder="Question text"
                        />
                        {editingQuestion.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={editingQuestion.correctAnswer === optIdx}
                              onChange={() => setEditingQuestion({...editingQuestion, correctAnswer: optIdx})}
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...editingQuestion.options];
                                newOptions[optIdx] = e.target.value;
                                setEditingQuestion({...editingQuestion, options: newOptions});
                              }}
                              className="flex-1 p-2 border rounded"
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-sm font-medium mb-1">Marks</label>
                          <input
                            type="number"
                            value={editingQuestion.marks}
                            onChange={(e) => setEditingQuestion({...editingQuestion, marks: parseInt(e.target.value)})}
                            className="w-24 p-2 border rounded"
                            min="1"
                          />
                        </div>
                        <textarea
                          value={editingQuestion.explanation || ''}
                          onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                          className="w-full p-2 border rounded"
                          placeholder="Explanation"
                          rows="2"
                        />
                        <div className="flex justify-end space-x-2">
                          <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                          <button onClick={() => setEditingQuestion(null)} className="px-3 py-1 bg-gray-600 text-white rounded">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              Q{idx + 1}: {q.text}
                              <span className="ml-2 text-sm text-gray-500">({q.marks || 1} marks)</span>
                            </p>
                            <div className="ml-6 mt-2 space-y-1">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center space-x-2">
                                  <input type="radio" disabled className="mr-2" />
                                  <label className={`text-sm ${optIdx === q.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                    {optIdx === q.correctAnswer && <span className="ml-2 text-green-600">✓ Correct</span>}
                                  </label>
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                                <strong>Explanation:</strong> {q.explanation}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => handleEditQuestion(idx)} className="text-blue-600 hover:text-blue-800" title="Edit">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteQuestion(idx)} className="text-red-600 hover:text-red-800" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestUploader;