import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, AlertCircle, CheckCircle, XCircle, ChevronRight,
  FileText, Users, Award, Shield, Brain
} from 'lucide-react';
import axios from 'axios';

const TestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    fetchTestDetails();
    checkApplicationStatus();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let testData = response.data.test || response.data;
      setTest(testData);
    } catch (err) {
      console.error('Error fetching test:', err);
      setError(err.response?.data?.message || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/students/applied-tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const applications = response.data.applications || [];
      const applied = applications.find(app => app.testId === testId || app.testId?._id === testId);
      
      if (applied) {
        setHasApplied(true);
        setApplicationStatus(applied.applicationStatus || applied.status);
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const handleStartTest = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const appResponse = await axios.get(`http://localhost:5000/api/students/applied-tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const applications = appResponse.data.applications || [];
      const application = applications.find(app => app.testId === testId || app.testId?._id === testId);
      
      if (!application) {
        alert('Please apply for this test first.');
        navigate(`/student/apply/${testId}`);
        return;
      }
      
      if (application.applicationStatus !== 'approved') {
        alert('Your application is pending approval. Please wait for admin approval.');
        return;
      }
      
      // Store test start info in sessionStorage
      sessionStorage.setItem(`test_${testId}_started`, Date.now().toString());
      sessionStorage.setItem(`test_${testId}_active`, 'true');
      
      // Navigate to the test interface
      navigate(`/student/take-test/${testId}`);
      
    } catch (err) {
      console.error('Error starting test:', err);
      alert(err.response?.data?.message || 'Failed to start test');
    }
  };

  const handleApply = () => {
    navigate(`/student/apply/${testId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AINTS Test...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The test you\'re looking for doesn\'t exist.'}</p>
          <Link to="/student/dashboard" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const startDate = new Date(test.startDate);
  const endDate = new Date(test.endDate);
  
  const isTestAvailable = startDate <= now && endDate >= now && test.status === 'published';
  const isTestUpcoming = startDate > now;
  const isTestExpired = endDate < now;
  const canApply = isTestAvailable && !hasApplied;
  const canStart = isTestAvailable && hasApplied && applicationStatus === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* AINTS Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS</span>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{test.title}</h1>
              <p className="text-gray-600 mt-1">{test.description || 'No description available'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isTestAvailable && (
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Available Now
                </div>
              )}
              {isTestUpcoming && (
                <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Upcoming
                </div>
              )}
              {isTestExpired && (
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  Expired
                </div>
              )}
              {hasApplied && applicationStatus === 'approved' && (
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Application Approved
                </div>
              )}
              {hasApplied && applicationStatus === 'pending' && (
                <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Pending Approval
                </div>
              )}
            </div>
          </div>

          {/* Test Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-semibold text-gray-700">{test.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Total Marks</p>
                <p className="font-semibold text-gray-700">{test.totalMarks}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Questions</p>
                <p className="font-semibold text-gray-700">{test.totalQuestions || test.questions?.length || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Passing Marks</p>
                <p className="font-semibold text-gray-700">{test.passingMarks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Details Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Test Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Subject</p>
              <p className="font-medium text-gray-700">{test.subject || 'General'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Difficulty Level</p>
              <p className="font-medium text-gray-700 capitalize">{test.difficulty || 'Medium'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium text-gray-700">{startDate.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium text-gray-700">{endDate.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Test Instructions</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <p className="text-gray-700">Read each question carefully before answering.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">2</span>
              </div>
              <p className="text-gray-700">You have {test.duration} minutes to complete the test.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">3</span>
              </div>
              <p className="text-gray-700">Once submitted, you cannot change your answers.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">4</span>
              </div>
              <p className="text-gray-700">Fullscreen mode is required during the test.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">5</span>
              </div>
              <p className="text-gray-700">Webcam access is mandatory for proctoring.</p>
            </div>
          </div>
        </div>

        {/* Anti-Cheating Notice */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Anti-Cheating Measures</h3>
              <p className="text-sm text-red-700 mt-1">
                This test is monitored. Any suspicious activity such as tab switching, multiple faces, 
                or mobile phone detection will result in penalties including time deduction or test termination.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/student/tests')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
          >
            ← Back to Tests
          </button>
          
          {canApply && (
            <button
              onClick={handleApply}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center space-x-2"
            >
              <FileText className="h-5 w-5" />
              <span>Apply for Test</span>
            </button>
          )}
          
          {canStart && (
            <button
              onClick={handleStartTest}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Start Test Now</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          
          {hasApplied && applicationStatus === 'pending' && (
            <button
              disabled
              className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Clock className="h-5 w-5 animate-pulse" />
              <span>Application Pending Approval</span>
            </button>
          )}
          
          {isTestUpcoming && !hasApplied && (
            <button
              disabled
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-500 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Clock className="h-5 w-5" />
              <span>Starts on {startDate.toLocaleDateString()}</span>
            </button>
          )}
          
          {isTestExpired && (
            <button
              disabled
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-500 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <XCircle className="h-5 w-5" />
              <span>Test Expired</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPage;