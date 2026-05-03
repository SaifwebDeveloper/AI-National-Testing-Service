import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Mail, Download, Eye, Clock, CheckCircle, 
  AlertCircle, Users, Award, BarChart3, TrendingUp, 
  Calendar, Filter, RefreshCw, X, FileText, 
  Trophy, ChevronRight, Search, XCircle
} from 'lucide-react';
import axios from 'axios';

const ResultAnnouncement = () => {
  const [completedTests, setCompletedTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCompletedTests();
  }, []);

  const fetchCompletedTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/completed-tests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let testsData = [];
      if (response.data.tests) {
        testsData = response.data.tests;
      } else if (Array.isArray(response.data)) {
        testsData = response.data;
      }
      
      setCompletedTests(testsData);
    } catch (error) {
      console.error('Error fetching completed tests:', error);
      setCompletedTests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (testId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [resultsRes, statsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/admin/results/${testId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/results/statistics/${testId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      let resultsData = [];
      if (resultsRes.data.results) {
        resultsData = resultsRes.data.results;
      } else if (Array.isArray(resultsRes.data)) {
        resultsData = resultsRes.data;
      }
      
      setResults(resultsData);
      setStatistics(statsRes.data.statistics || statsRes.data);
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSelect = async (test) => {
    setSelectedTest(test);
    await fetchResults(test._id);
    setShowResultsModal(true);
  };

  const handleAnnounceResults = async () => {
    if (!selectedTest) return;
    
    setAnnouncing(true);
    setEmailStatus(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/admin/announce-results/${selectedTest._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEmailStatus({ 
        type: 'success', 
        message: 'Results announced and emails sent successfully!' 
      });
      
      await fetchCompletedTests();
      await fetchResults(selectedTest._id);
      
      setTimeout(() => setEmailStatus(null), 5000);
    } catch (error) {
      setEmailStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Error announcing results' 
      });
    } finally {
      setAnnouncing(false);
    }
  };

  const downloadResults = async () => {
    if (!selectedTest) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/results/export/${selectedTest._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTest.title}_results.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading results:', error);
      alert('Failed to download results');
    }
  };

  const resendResultEmail = async (resultId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/resend-result-email/${resultId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Result email resent successfully!');
      
      if (selectedTest) {
        await fetchResults(selectedTest._id);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend email');
    }
  };

  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const filteredResults = results.filter(result => {
    if (searchTerm) {
      return result.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             result.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             result.cnic?.includes(searchTerm);
    }
    if (filterStatus !== 'all') {
      return result.status === filterStatus;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'pass') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Passed</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</span>;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && completedTests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Result Announcement</h1>
            <p className="text-gray-600 mt-2">Announce results and notify students via email</p>
          </div>
          <button
            onClick={fetchCompletedTests}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Tests</p>
                <p className="text-2xl font-bold text-blue-600">{completedTests.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-purple-600">
                  {completedTests.reduce((sum, test) => sum + (test.studentCount || 0), 0)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-green-600">
                  {completedTests.reduce((sum, test) => sum + (test.totalSubmissions || 0), 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Results Announced</p>
                <p className="text-2xl font-bold text-orange-600">
                  {completedTests.filter(t => t.resultAnnounced).length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Megaphone className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Completed Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedTests.map((test) => (
            <div
              key={test._id}
              onClick={() => handleTestSelect(test)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition">
                      {test.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {test.description || 'No description'}
                    </p>
                  </div>
                  {test.resultAnnounced ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Students:</span>
                    <span className="font-semibold">{test.studentCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Submissions:</span>
                    <span className="font-semibold">{test.totalSubmissions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Passed:</span>
                    <span className="font-semibold text-green-600">{test.passedCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Avg Score:</span>
                    <span className="font-semibold">{test.avgScore || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">End Date:</span>
                    <span className="text-sm text-gray-500">
                      {test.endDate ? new Date(test.endDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${test.resultAnnounced ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {test.resultAnnounced ? 'Results Announced' : 'Pending'}
                    </span>
                  </div>
                  <button className="text-blue-600 text-sm group-hover:text-blue-800 flex items-center gap-1">
                    View Results <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {completedTests.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Tests</h3>
              <p className="text-gray-500">There are no completed tests available for result announcement.</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {showResultsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedTest.title}</h2>
                <p className="text-blue-100 text-sm mt-1">Results Management</p>
              </div>
              <button 
                onClick={() => setShowResultsModal(false)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                {!selectedTest.resultAnnounced && (
                  <button
                    onClick={handleAnnounceResults}
                    disabled={announcing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {announcing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Announcing...</span>
                      </>
                    ) : (
                      <>
                        <Megaphone className="h-4 w-4" />
                        <span>Announce Results</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={downloadResults}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Email Status */}
              {emailStatus && (
                <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                  emailStatus.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {emailStatus.type === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span>{emailStatus.message}</span>
                </div>
              )}

              {/* Statistics Cards */}
              {statistics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-900">{statistics.totalStudents || 0}</p>
                    <p className="text-xs text-gray-500">Total Students</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Award className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-600">{statistics.passed || 0}</p>
                    <p className="text-xs text-gray-500">Passed</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-red-600">{statistics.failed || 0}</p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-purple-600">{statistics.avgScore || 0}%</p>
                    <p className="text-xs text-gray-500">Average Score</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Trophy className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-yellow-600">{statistics.passRate || 0}%</p>
                    <p className="text-xs text-gray-500">Pass Rate</p>
                  </div>
                </div>
              )}

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, email or CNIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pass">Passed Only</option>
                  <option value="fail">Failed Only</option>
                </select>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNIC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredResults.map((result, idx) => (
                      <tr key={result._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 font-medium">{result.rank || idx + 1}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => viewStudentDetails(result)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {result.studentName}
                          </button>
                          <p className="text-xs text-gray-400">{result.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{result.cnic || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{result.obtainedMarks}/{result.totalMarks}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold text-sm ${getScoreColor(result.percentage)}`}>
                            {result.percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(result.status)}</td>
                        <td className="px-4 py-3">
                          {result.emailed ? (
                            <span className="flex items-center space-x-1 text-green-600">
                              <Mail className="h-3 w-3" />
                              <span className="text-xs">Sent</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => resendResultEmail(result._id)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Resend Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No results found for this test
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Student Details</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {selectedStudent.studentName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedStudent.studentName}</p>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">CNIC</p>
                  <p className="font-medium text-sm">{selectedStudent.cnic || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="font-medium text-sm">{selectedStudent.obtainedMarks}/{selectedStudent.totalMarks}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Percentage</p>
                  <p className={`font-medium text-sm ${getScoreColor(selectedStudent.percentage)}`}>
                    {selectedStudent.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium text-sm capitalize">{selectedStudent.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rank</p>
                  <p className="font-medium text-sm">#{selectedStudent.rank || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email Sent</p>
                  <p className="font-medium text-sm">{selectedStudent.emailed ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultAnnouncement;