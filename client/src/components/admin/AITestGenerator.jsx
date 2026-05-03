import React, { useState, useCallback } from 'react';
import { 
  Sparkles, FileText, Loader, CheckCircle, XCircle, 
  Edit2, Save, Trash2, Upload, Brain, Zap, 
  Clock, Award, BookOpen, Plus, Settings, 
  Eye, Download, AlertCircle
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const AITestGenerator = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [testDetails, setTestDetails] = useState({
    title: '',
    subject: '',
    totalMarks: '',
    duration: '',
    difficulty: 'medium',
    passingMarks: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile && (uploadedFile.type === 'application/pdf' || 
        uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setFile(uploadedFile);
      setUploadStatus(null);
      setGeneratedQuestions([]);
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
    maxFiles: 1,
    multiple: false
  });

  const handleInputChange = (e) => {
    setTestDetails({
      ...testDetails,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!file) {
      setUploadStatus({ type: 'error', message: 'Please select a file' });
      return false;
    }
    if (!testDetails.title) {
      setUploadStatus({ type: 'error', message: 'Please enter test title' });
      return false;
    }
    if (!testDetails.totalMarks) {
      setUploadStatus({ type: 'error', message: 'Please enter total marks' });
      return false;
    }
    if (!testDetails.duration) {
      setUploadStatus({ type: 'error', message: 'Please enter duration' });
      return false;
    }
    return true;
  };

  const handleExtractQuestions = async () => {
    if (!validateForm()) return;

    setGenerating(true);
    const formData = new FormData();
    formData.append('file', file);
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
        timeout: 120000
      });
      
      if (response.data.success) {
        setGeneratedQuestions(response.data.questions);
        setExtractedText(response.data.extractedTextPreview || '');
        setUploadStatus({ 
          type: 'success', 
          message: `Successfully extracted ${response.data.questions.length} questions! Review and edit them before saving.` 
        });
      } else {
        setUploadStatus({ type: 'error', message: response.data.message || 'Failed to extract questions' });
      }
    } catch (error) {
      console.error('Extraction error:', error);
      setUploadStatus({ type: 'error', message: error.response?.data?.message || 'Failed to extract questions' });
    } finally {
      setGenerating(false);
    }
  };

  const handleEditQuestion = (index) => {
    setEditingIndex(index);
    setEditQuestion({ ...generatedQuestions[index] });
  };

  const handleSaveEdit = () => {
    const updatedQuestions = [...generatedQuestions];
    updatedQuestions[editingIndex] = editQuestion;
    setGeneratedQuestions(updatedQuestions);
    setEditingIndex(null);
    setEditQuestion(null);
    setUploadStatus({ type: 'success', message: 'Question updated successfully!' });
    setTimeout(() => setUploadStatus(null), 3000);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditQuestion(null);
  };

  const handleDeleteQuestion = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = generatedQuestions.filter((_, i) => i !== index);
      setGeneratedQuestions(updatedQuestions);
      setUploadStatus({ type: 'success', message: 'Question deleted successfully!' });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      text: 'New Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      marks: 1,
      explanation: 'Add explanation here'
    };
    setGeneratedQuestions([...generatedQuestions, newQuestion]);
    setUploadStatus({ type: 'success', message: 'New question added!' });
    setTimeout(() => setUploadStatus(null), 3000);
  };

  const handleSaveTest = async () => {
    if (generatedQuestions.length === 0) {
      setUploadStatus({ type: 'error', message: 'No questions to save. Please extract questions first.' });
      return;
    }

    if (!testDetails.title || !testDetails.totalMarks || !testDetails.duration) {
      setUploadStatus({ type: 'error', message: 'Please fill all required test details.' });
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', testDetails.title);
    formData.append('subject', testDetails.subject);
    formData.append('totalMarks', testDetails.totalMarks);
    formData.append('duration', testDetails.duration);
    formData.append('difficulty', testDetails.difficulty);
    formData.append('passingMarks', testDetails.passingMarks || Math.floor(testDetails.totalMarks * 0.4));
    formData.append('startDate', new Date().toISOString());
    formData.append('endDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
    formData.append('questions', JSON.stringify(generatedQuestions));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/tests/upload-with-questions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        timeout: 120000
      });
      
      setUploadStatus({ type: 'success', message: `Test "${testDetails.title}" saved successfully with ${generatedQuestions.length} questions!` });
      
      // Reset form
      setFile(null);
      setGeneratedQuestions([]);
      setTestDetails({
        title: '',
        subject: '',
        totalMarks: '',
        duration: '',
        difficulty: 'medium',
        passingMarks: ''
      });
      
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus({ type: 'error', message: error.response?.data?.message || 'Failed to save test' });
    } finally {
      setSaving(false);
    }
  };

  const getQuestionStats = () => {
    const totalMarks = generatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const avgMarks = (totalMarks / generatedQuestions.length).toFixed(1);
    return { totalMarks, avgMarks };
  };

  const stats = getQuestionStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Test Generator</h1>
          </div>
          <p className="text-gray-600 ml-12">Upload your document and let AI extract and generate MCQs automatically</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600">
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Upload Document</h2>
                </div>
                <p className="text-purple-100 text-sm mt-1">Upload PDF or Word document</p>
              </div>
              
              <div className="p-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-purple-500' : 'text-gray-400'}`} />
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
                      <p className="text-gray-600">Drag & drop a PDF or Word document here</p>
                      <p className="text-sm text-gray-400 mt-2">or click to select</p>
                      <p className="text-xs text-gray-400 mt-2">Supports: .pdf, .docx</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Test Settings Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Test Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={testDetails.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science Final Exam"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={testDetails.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science, Mathematics"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Marks *
                    </label>
                    <input
                      type="number"
                      name="totalMarks"
                      value={testDetails.totalMarks}
                      onChange={handleInputChange}
                      placeholder="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (min) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={testDetails.duration}
                      onChange={handleInputChange}
                      placeholder="60"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      name="difficulty"
                      value={testDetails.difficulty}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      name="passingMarks"
                      value={testDetails.passingMarks}
                      onChange={handleInputChange}
                      placeholder="40"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleExtractQuestions}
                disabled={generating || !file}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Extracting Questions...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Extract Questions with AI</span>
                  </>
                )}
              </button>
              
              {generatedQuestions.length > 0 && (
                <button
                  onClick={handleSaveTest}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Saving Test...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Test ({generatedQuestions.length} questions)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Questions */}
          <div className="lg:col-span-2">
            {uploadStatus && (
              <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                uploadStatus.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : uploadStatus.type === 'error' 
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : uploadStatus.type === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Brain className="h-5 w-5" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}

            {generatedQuestions.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold">Extracted Questions</h2>
                      <p className="text-purple-100 text-sm">{generatedQuestions.length} questions extracted</p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4" />
                        <span>{stats.totalMarks} total marks</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Avg {stats.avgMarks} marks/q</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={handleAddQuestion}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Question</span>
                    </button>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {generatedQuestions.map((q, idx) => (
                      <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        {editingIndex === idx ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editQuestion.text}
                              onChange={(e) => setEditQuestion({...editQuestion, text: e.target.value})}
                              className="w-full p-2 border rounded font-medium"
                              placeholder="Question text"
                            />
                            {editQuestion.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  checked={editQuestion.correctAnswer === optIdx}
                                  onChange={() => setEditQuestion({...editQuestion, correctAnswer: optIdx})}
                                  className="mr-2"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...editQuestion.options];
                                    newOptions[optIdx] = e.target.value;
                                    setEditQuestion({...editQuestion, options: newOptions});
                                  }}
                                  className="flex-1 p-2 border rounded"
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                />
                              </div>
                            ))}
                            <div className="flex items-center space-x-4">
                              <label className="text-sm text-gray-600">Marks:</label>
                              <input
                                type="number"
                                value={editQuestion.marks}
                                onChange={(e) => setEditQuestion({...editQuestion, marks: parseInt(e.target.value)})}
                                className="w-20 p-1 border rounded"
                                min="1"
                              />
                            </div>
                            <textarea
                              value={editQuestion.explanation || ''}
                              onChange={(e) => setEditQuestion({...editQuestion, explanation: e.target.value})}
                              className="w-full p-2 border rounded"
                              placeholder="Explanation (optional)"
                              rows="2"
                            />
                            <div className="flex justify-end space-x-2">
                              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                                <Save className="h-4 w-4" />
                              </button>
                              <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                                  <span className="text-xs text-gray-400">({q.marks || 1} marks)</span>
                                </div>
                                <p className="font-medium text-gray-900">{q.text}</p>
                                <div className="ml-6 mt-3 space-y-1">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-500 w-6">{String.fromCharCode(65 + optIdx)}.</span>
                                      <span className={`text-sm ${optIdx === q.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                                        {opt}
                                      </span>
                                      {optIdx === q.correctAnswer && (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && (
                                  <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                                    <strong>Explanation:</strong> {q.explanation}
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditQuestion(idx)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(idx)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
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
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                {file ? (
                  <>
                    <Brain className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Extract</h3>
                    <p className="text-gray-500 mb-4">
                      Click "Extract Questions with AI" to automatically generate MCQs from your document.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Document Uploaded</h3>
                    <p className="text-gray-500">Upload a PDF or Word document to get started.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestGenerator;