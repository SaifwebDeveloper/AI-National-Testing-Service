import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle, XCircle, Download, Share2, Home, BarChart3, Clock, FileText, Trophy, AlertCircle } from 'lucide-react';
import axios from 'axios';

const TestResult = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching result ID:', resultId);
      
      const response = await axios.get(`http://localhost:5000/api/results/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('API Response:', response.data);
      
      let resultData = response.data.result || response.data;
      setResult(resultData);
    } catch (err) {
      console.error('Error fetching result:', err);
      setError(err.response?.data?.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const downloadCertificate = () => {
    const studentName = result?.studentName || result?.studentId?.name || 'Student';
    const testTitle = result?.testTitle || result?.testId?.title || 'Test';
    const percentage = result?.percentage || 0;
    const obtainedMarks = result?.obtainedMarks || 0;
    const totalMarks = result?.totalMarks || 0;
    
    const certificateContent = `CERTIFICATE OF ACHIEVEMENT\n\nPresented to\n\n${studentName}\n\nFor successfully completing\n\n${testTitle}\n\nScore: ${obtainedMarks}/${totalMarks} (${percentage}%)\nGrade: ${getGrade(percentage)}\nDate: ${new Date(result?.completedAt).toLocaleDateString()}`;
    
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_${resultId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareResult = () => {
    const percentage = result?.percentage || 0;
    const testTitle = result?.testTitle || result?.testId?.title || 'Test';
    const status = result?.status || (percentage >= 40 ? 'pass' : 'fail');
    
    if (navigator.share) {
      navigator.share({
        title: 'My Test Result',
        text: `I scored ${percentage}% on ${testTitle} and ${status === 'pass' ? 'PASSED' : 'FAILED'}!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const printResult = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Result Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'Unable to load your result'}</p>
          <button onClick={() => navigate('/student/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const studentName = result.studentName || result.studentId?.name || 'Student';
  const testTitle = result.testTitle || result.testId?.title || 'Test';
  const totalMarks = result.totalMarks || 0;
  const obtainedMarks = result.obtainedMarks || 0;
  const percentage = result.percentage || 0;
  const status = result.status || (percentage >= 40 ? 'pass' : 'fail');
  const isPassed = status === 'pass';
  const scoreColor = getScoreColor(percentage);
  const grade = getGrade(percentage);
  const completedAt = result.completedAt ? new Date(result.completedAt) : new Date();
  const timeTaken = result.timeTaken || 0;
  const correctAnswers = result.correctAnswers || 0;
  const incorrectAnswers = result.incorrectAnswers || 0;
  const unanswered = result.unanswered || 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Result Header */}
        <div className={`rounded-xl p-8 mb-6 text-center ${isPassed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
          <Trophy className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Test Completed!</h1>
          <p className="text-lg opacity-90">{testTitle}</p>
          <div className={`mt-4 inline-block px-6 py-2 rounded-full text-lg font-semibold bg-white ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
            {isPassed ? 'PASSED' : 'FAILED'}
          </div>
        </div>

        {/* Score Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Score Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Marks</p>
              <p className="text-2xl font-bold text-gray-900">{totalMarks}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Obtained Marks</p>
              <p className={`text-2xl font-bold ${scoreColor}`}>{obtainedMarks}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Percentage</p>
              <p className={`text-2xl font-bold ${scoreColor}`}>{percentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Grade</p>
              <p className="text-2xl font-bold text-purple-600">{grade}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`rounded-full h-2 transition-all duration-1000 ${isPassed ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Performance Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              Time Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Time Taken:</span><span className="font-medium">{timeTaken} minutes</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Completed On:</span><span className="font-medium">{completedAt.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Award className="h-4 w-4 mr-2 text-blue-600" />
              Performance Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Correct Answers:</span><span className="font-medium text-green-600">{correctAnswers}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Incorrect Answers:</span><span className="font-medium text-red-600">{incorrectAnswers}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Unanswered:</span><span className="font-medium text-gray-600">{unanswered}</span></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Home className="h-4 w-4" /><span>Dashboard</span>
          </button>
          {isPassed && (
            <button onClick={downloadCertificate} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <Download className="h-4 w-4" /><span>Certificate</span>
            </button>
          )}
          <button onClick={shareResult} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2">
            <Share2 className="h-4 w-4" /><span>Share</span>
          </button>
          <button onClick={printResult} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2">
            <FileText className="h-4 w-4" /><span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResult;