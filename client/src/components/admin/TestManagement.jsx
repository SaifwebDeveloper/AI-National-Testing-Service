import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Trash2, Copy, Clock, 
  Users, CheckCircle, XCircle, Download, Plus, BarChart3, 
  Award, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw, FileText
} from 'lucide-react';
import axios from 'axios';

const TestManagement = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [testStats, setTestStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    filterTests();
  }, [searchTerm, statusFilter, tests]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Try to fetch from multiple possible endpoints
      let testsData = [];
      let response = null;
      
      try {
        response = await axios.get('http://localhost:5000/api/tests', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.log('First endpoint failed, trying admin endpoint');
        response = await axios.get('http://localhost:5000/api/admin/tests', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.tests) {
        testsData = response.data.tests;
      } else if (Array.isArray(response.data)) {
        testsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        testsData = response.data.data;
      }
      
      setTests(testsData);
      setFilteredTests(testsData);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTests([]);
      setFilteredTests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTests = () => {
    let filtered = [...tests];
    
    if (searchTerm) {
      filtered = filtered.filter(test => 
        (test.title && test.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (test.subject && test.subject.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter);
    }
    
    setFilteredTests(filtered);
    setCurrentPage(1);
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tests/${selectedTest._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTests();
      setShowDeleteModal(false);
      setSelectedTest(null);
    } catch (error) {
      console.error('Error deleting test:', error);
      alert(error.response?.data?.message || 'Failed to delete test');
    }
  };

  const handlePublishTest = async (testId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tests/${testId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTests();
    } catch (error) {
      console.error('Error publishing test:', error);
      alert(error.response?.data?.message || 'Failed to publish test');
    }
  };

  const handleDuplicateTest = async (test) => {
    try {
      const token = localStorage.getItem('token');
      const duplicateData = {
        title: `${test.title} (Copy)`,
        description: test.description || '',
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        duration: test.duration,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        subject: test.subject || '',
        difficulty: test.difficulty || 'medium'
      };
      
      await axios.post('http://localhost:5000/api/tests', duplicateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTests();
    } catch (error) {
      console.error('Error duplicating test:', error);
      alert('Failed to duplicate test');
    }
  };

  const viewTestDetails = (test) => {
    setSelectedTest(test);
    setShowViewModal(true);
  };

  const viewTestStats = async (test) => {
    setSelectedTest(test);
    setTestStats(null);
    setShowStatsModal(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/results/statistics/${test._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestStats(response.data.statistics || response.data);
    } catch (error) {
      setTestStats({ totalStudents: 0, passed: 0, failed: 0, avgScore: 0 });
    }
  };

  const exportTestResults = async (testId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/results/export/${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_results_${testId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting results:', error);
      alert('Failed to export results');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      ongoing: { color: 'bg-blue-100 text-blue-800', label: 'Ongoing' },
      completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    const config = statusMap[status] || statusMap.draft;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty) => {
    const difficultyMap = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-orange-100 text-orange-700',
      expert: 'bg-red-100 text-red-700'
    };
    const color = difficultyMap[difficulty] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${color}`}>
        {difficulty || 'medium'}
      </span>
    );
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

  if (loading) {
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Management</h1>
            <p className="text-gray-600 mt-1">Manage, edit, and publish your tests</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchTests}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => window.location.href = '/admin/upload'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Test</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests by title, subject or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Found <span className="font-semibold text-blue-600">{filteredTests.length}</span> tests
          </p>
        </div>

        {/* Tests Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks/Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentTests.map((test) => (
                  <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{test.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{test.description?.substring(0, 60) || 'No description'}</p>
                        {getDifficultyBadge(test.difficulty)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{test.subject || 'General'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <div>{test.totalMarks || 0} marks</div>
                        <div className="text-xs text-gray-400">{test.duration || 0} min</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">0</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(test.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => viewTestDetails(test)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => viewTestStats(test)} 
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" 
                          title="View Statistics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDuplicateTest(test)} 
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition" 
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => exportTestResults(test._id)} 
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" 
                          title="Export Results"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {test.status === 'draft' && (
                          <button 
                            onClick={() => handlePublishTest(test._id)} 
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" 
                            title="Publish"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedTest(test);
                            setShowDeleteModal(true);
                          }} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" 
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTests.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tests found</p>
              <button 
                onClick={() => window.location.href = '/admin/upload'}
                className="mt-3 text-blue-600 hover:text-blue-800"
              >
                Create your first test →
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* View Test Modal */}
      {showViewModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedTest.title}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-gray-900 mt-1">{selectedTest.description || 'No description'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Marks</h3>
                    <p className="text-gray-900 font-semibold">{selectedTest.totalMarks}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Passing Marks</h3>
                    <p className="text-gray-900 font-semibold">{selectedTest.passingMarks}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                    <p className="text-gray-900 font-semibold">{selectedTest.duration} minutes</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Difficulty</h3>
                    <p className="text-gray-900 capitalize">{selectedTest.difficulty || 'Medium'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                    <p className="text-gray-900">{new Date(selectedTest.startDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                    <p className="text-gray-900">{new Date(selectedTest.endDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Test Statistics</h2>
              <button onClick={() => setShowStatsModal(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{selectedTest.title}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{testStats?.totalStudents || 0}</p>
                  <p className="text-xs text-gray-500">Total Students</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{testStats?.passed || 0}</p>
                  <p className="text-xs text-gray-500">Passed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{testStats?.failed || 0}</p>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{testStats?.avgScore || 0}%</p>
                  <p className="text-xs text-gray-500">Average Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-semibold text-gray-900">Delete Test</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong className="text-red-600">{selectedTest.title}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTest}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;