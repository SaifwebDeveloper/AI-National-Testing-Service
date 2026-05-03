import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Clock, Award, Users, CheckCircle, AlertCircle, ExternalLink, Eye, BookOpen, Play, XCircle, Camera, Shield, AlertTriangle, Monitor, Smartphone, ArrowUpDown, Sparkles, Timer, Lock, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AvailableTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [applications, setApplications] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [applying, setApplying] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to check expirations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTests();
    fetchApplications();
    fetchCompletedTests();
  }, []);

  useEffect(() => {
    filterAndSortTests();
  }, [searchTerm, categoryFilter, sortBy, tests, currentTime]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view available tests');
        setLoading(false);
        return;
      }
      
      console.log('Fetching tests from API...');
      const response = await axios.get('http://localhost:5000/api/tests/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('API Response:', response.data);
      
      let testsData = [];
      if (response.data.tests) {
        testsData = response.data.tests;
      } else if (Array.isArray(response.data)) {
        testsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        testsData = response.data.data;
      }
      
      console.log('Tests data:', testsData);
      
      // Add expiry status to each test
      const testsWithExpiry = testsData.map(test => ({
        ...test,
        isExpired: isTestExpired(test)
      }));
      
      // Sort tests by creation date (newest first)
      const sortedTests = [...testsWithExpiry].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.startDate || 0);
        const dateB = new Date(b.createdAt || b.startDate || 0);
        return dateB - dateA;
      });
      
      setTests(sortedTests);
      setFilteredTests(sortedTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load tests');
      setTests([]);
      setFilteredTests([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshTests = () => {
    fetchTests();
    fetchApplications();
    fetchCompletedTests();
  };

  // Function to check if a test is expired
  const isTestExpired = (test) => {
    if (!test.endDate) return false;
    const endDate = new Date(test.endDate);
    const now = new Date();
    return now > endDate;
  };

  // Function to check if test is currently active
  const isTestActive = (test) => {
    if (!test.startDate) return true;
    const startDate = new Date(test.startDate);
    const endDate = test.endDate ? new Date(test.endDate) : null;
    const now = new Date();
    
    if (now < startDate) return false;
    if (endDate && now > endDate) return false;
    return true;
  };

  // Get test status message
  const getTestStatus = (test) => {
    if (!test.startDate) return { text: 'Available', color: 'text-green-600', bg: 'bg-green-100' };
    
    const startDate = new Date(test.startDate);
    const endDate = test.endDate ? new Date(test.endDate) : null;
    const now = new Date();
    
    if (now < startDate) {
      const daysLeft = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      return { text: `Starts in ${daysLeft} days`, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    if (endDate && now > endDate) {
      return { text: 'Expired', color: 'text-red-600', bg: 'bg-red-100' };
    }
    if (endDate) {
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return { text: `${daysLeft} days left`, color: 'text-green-600', bg: 'bg-green-100' };
    }
    return { text: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/students/applied-tests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let applicationsData = [];
      if (response.data.applications) {
        applicationsData = response.data.applications;
      } else if (Array.isArray(response.data)) {
        applicationsData = response.data;
      }
      
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    }
  };

  const fetchCompletedTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/results/my-results', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const results = response.data.results || [];
      const completedTestIds = results.map(result => result.testId?._id || result.testId);
      setCompletedTests(completedTestIds);
    } catch (error) {
      console.error('Error fetching completed tests:', error);
      setCompletedTests([]);
    }
  };

  const filterAndSortTests = () => {
    let filtered = [...tests];
    
    if (searchTerm) {
      filtered = filtered.filter(test => 
        test.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(test => test.category === categoryFilter);
    }
    
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'newest':
          const dateA = new Date(a.createdAt || a.startDate || 0);
          const dateB = new Date(b.createdAt || b.startDate || 0);
          return dateB - dateA;
        case 'oldest':
          const dateOldA = new Date(a.createdAt || a.startDate || 0);
          const dateOldB = new Date(b.createdAt || b.startDate || 0);
          return dateOldA - dateOldB;
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        default:
          return 0;
      }
    });
    
    setFilteredTests(filtered);
  };

  const getApplicationStatus = (testId) => {
    const application = applications.find(app => app.testId === testId || app.testId?._id === testId);
    if (!application) return null;
    return {
      status: application.applicationStatus || application.status,
      applicationId: application._id
    };
  };

  const isTestCompleted = (testId) => {
    return completedTests.includes(testId);
  };

  const handleApplyClick = (test) => {
    if (test.isExpired) {
      alert('This test has expired and is no longer available for application.');
      return;
    }
    setSelectedTest(test);
    setShowApplyModal(true);
  };

  const handleStartTest = (testId) => {
    sessionStorage.setItem(`test_${testId}_started`, Date.now().toString());
    sessionStorage.setItem(`test_${testId}_active`, 'true');
    window.location.href = `/student/test/${testId}`;
  };

  const confirmApplication = async () => {
    if (!selectedTest) return;
    
    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/tests/apply/${selectedTest._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Successfully applied for "${selectedTest.title}"! Once approved, you can start the test.`);
      setShowApplyModal(false);
      setSelectedTest(null);
      fetchApplications();
    } catch (error) {
      alert(error.response?.data?.message || 'Error applying for test');
    } finally {
      setApplying(false);
    }
  };

  const getButtonState = (test) => {
    const isCompleted = isTestCompleted(test._id);
    const appStatus = getApplicationStatus(test._id);
    const isExpired = test.isExpired;
    const isNotStarted = test.startDate && new Date(test.startDate) > new Date();
    
    if (isCompleted) {
      return { text: 'Already Taken', disabled: true, icon: <CheckCircle className="h-4 w-4" />, color: 'bg-gray-400 cursor-not-allowed' };
    }
    if (isExpired) {
      return { text: 'Test Expired', disabled: true, icon: <Lock className="h-4 w-4" />, color: 'bg-red-500 cursor-not-allowed' };
    }
    if (isNotStarted && test.status === 'published') {
      return { text: 'Not Started Yet', disabled: true, icon: <Timer className="h-4 w-4" />, color: 'bg-orange-500 cursor-not-allowed' };
    }
    if (appStatus?.status === 'approved') {
      return { text: 'Start Test', disabled: false, icon: <Play className="h-4 w-4" />, color: 'bg-green-600 hover:bg-green-700' };
    }
    if (appStatus?.status === 'pending') {
      return { text: 'Pending Approval', disabled: true, icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500 cursor-not-allowed' };
    }
    if (appStatus?.status === 'rejected') {
      return { text: 'Application Rejected', disabled: true, icon: <XCircle className="h-4 w-4" />, color: 'bg-red-500 cursor-not-allowed' };
    }
    return { text: 'Apply Now', disabled: false, icon: <CheckCircle className="h-4 w-4" />, color: 'bg-blue-600 hover:bg-blue-700' };
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'academic', label: 'Academic' },
    { value: 'professional', label: 'Professional' },
    { value: 'government', label: 'Government' },
    { value: 'certification', label: 'Certification' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: <Sparkles className="h-4 w-4" /> },
    { value: 'oldest', label: 'Oldest First', icon: <Clock className="h-4 w-4" /> },
    { value: 'title', label: 'Title A-Z', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'duration', label: 'Duration (Shortest)', icon: <Clock className="h-4 w-4" /> }
  ];

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-orange-100 text-orange-700';
      case 'expert': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-4 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Unable to Load Tests</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={refreshTests}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-4 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Available Tests</h1>
              <p className="text-gray-600 mt-1">Browse and apply for available AINTS tests with AI proctoring</p>
            </div>
            <button 
              onClick={refreshTests}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests by title, subject or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-white"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Found <span className="font-semibold text-blue-600">{filteredTests.length}</span> tests
          </p>
          {sortBy === 'newest' && filteredTests.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Newest tests shown first
            </span>
          )}
        </div>

        {/* Tests Grid */}
        {filteredTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test, index) => {
              const buttonState = getButtonState(test);
              const isCompleted = isTestCompleted(test._id);
              const isNew = index < 3 && sortBy === 'newest';
              const testStatus = getTestStatus(test);
              const isExpired = test.isExpired;
              
              return (
                <div 
                  key={test._id} 
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group border ${
                    isExpired ? 'border-red-200 bg-red-50/30' : 
                    isNew ? 'border-blue-200 ring-1 ring-blue-200' : 'border-gray-100'
                  }`}
                >
                  {isNew && !isExpired && (
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs py-1 px-3 text-center font-medium flex items-center justify-center gap-1">
                      <Sparkles className="h-3 w-3" /> New Test
                    </div>
                  )}
                  {isExpired && (
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs py-1 px-3 text-center font-medium flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" /> Test Expired
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className={`font-semibold text-lg transition-colors ${
                            isExpired ? 'text-gray-500' : 'text-gray-900 group-hover:text-blue-600'
                          }`}>
                            {test.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(test.difficulty)}`}>
                            {test.difficulty || 'medium'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{test.description || 'No description available'}</p>
                      </div>
                    </div>

                    {/* Test Status Badge */}
                    <div className="mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${testStatus.bg} ${testStatus.color} flex items-center gap-1 w-fit`}>
                        <Timer className="h-3 w-3" />
                        {testStatus.text}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {test.subject && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{test.subject}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600 text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Start: {formatDate(test.startDate)}</span>
                      </div>
                      {test.endDate && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>End: {formatDate(test.endDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Duration: {test.duration || 0} minutes</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Award className="h-4 w-4 mr-2" />
                        <span>Total Marks: {test.totalMarks || 0}</span>
                      </div>
                    </div>

                    {/* Proctoring Features Badges */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <Camera className="h-3 w-3" /> Webcam
                        </span>
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Tab Monitor
                        </span>
                        <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Anti-Cheat
                        </span>
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <Monitor className="h-3 w-3" /> Fullscreen
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${test.status === 'published' && !isExpired ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-500">
                          {isExpired ? 'Expired' : (test.status === 'published' ? 'Applications Open' : 'Coming Soon')}
                        </span>
                      </div>
                      
                      {buttonState.disabled ? (
                        <div className={`px-4 py-2 ${buttonState.color} text-white rounded-lg cursor-not-allowed flex items-center space-x-2`}>
                          {buttonState.icon}
                          <span>{buttonState.text}</span>
                        </div>
                      ) : buttonState.text === 'Start Test' ? (
                        <button
                          onClick={() => handleStartTest(test._id)}
                          className={`px-4 py-2 ${buttonState.color} text-white rounded-lg transition-colors flex items-center space-x-2 shadow-sm hover:shadow-md`}
                        >
                          {buttonState.icon}
                          <span>{buttonState.text}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyClick(test)}
                          className={`px-4 py-2 ${buttonState.color} text-white rounded-lg transition-colors flex items-center space-x-2`}
                        >
                          {buttonState.icon}
                          <span>{buttonState.text}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tests Available</h3>
            <p className="text-gray-500">There are no tests available at the moment. Please check back later.</p>
            <button 
              onClick={refreshTests}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Apply Confirmation Modal */}
      {showApplyModal && selectedTest && !selectedTest.isExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ExternalLink className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Apply for Test</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to apply for <strong className="text-blue-600">{selectedTest.title}</strong>?
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{selectedTest.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="font-medium">{selectedTest.totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passing Marks:</span>
                  <span className="font-medium">{selectedTest.passingMarks || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{formatDate(selectedTest.startDate)}</span>
                </div>
                {selectedTest.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{formatDate(selectedTest.endDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Proctoring Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium mb-1">AI Proctoring Notice:</p>
                  <p>This test will be monitored with webcam, tab switching detection, and fullscreen mode. Please ensure you have a stable internet connection and working camera.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApplication}
                disabled={applying}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {applying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirm Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableTests;