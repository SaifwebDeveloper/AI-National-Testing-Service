import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, Mail, Award, TrendingUp, 
  Calendar, User, FileText, X, ChevronLeft, ChevronRight,
  RefreshCw, Clock, CheckCircle, XCircle, Phone, MapPin,
  BookOpen, GraduationCap
} from 'lucide-react';
import axios from 'axios';

const StudentResults = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, filterType, students]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let studentsData = [];
      if (response.data.students) {
        studentsData = response.data.students;
      } else if (Array.isArray(response.data)) {
        studentsData = response.data;
      }
      
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.cnic?.includes(searchTerm) ||
        student.phone?.includes(searchTerm)
      );
    }
    
    if (filterType === 'active') {
      filtered = filtered.filter(student => (student.stats?.testsTaken || 0) > 0);
    } else if (filterType === 'inactive') {
      filtered = filtered.filter(student => (student.stats?.testsTaken || 0) === 0);
    }
    
    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const viewStudentResults = async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/student-results/${student.id || student._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let resultsData = [];
      if (response.data.results) {
        resultsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        resultsData = response.data;
      }
      
      setStudentResults(resultsData);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching student results:', error);
      setStudentResults([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadStudentReport = async (student) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/student-results/${student.id || student._id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${student.name}_report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const resendResultEmail = async (resultId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/resend-result-email/${resultId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Result email resent successfully!');
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend email');
    }
  };

  const downloadAllResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/students/export-all', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_students_results.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading all results:', error);
      alert('Failed to download results');
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (avgScore) => {
    if (avgScore >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (avgScore >= 60) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (avgScore >= 40) return { text: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Need Improvement', color: 'bg-red-100 text-red-800' };
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  if (loading && students.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">Student Results</h1>
            <p className="text-gray-600 mt-1">View and manage student performance and results</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchStudents}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={downloadAllResults}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => (s.stats?.testsTaken || 0) > 0).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0 
                    ? (students.reduce((sum, s) => sum + (parseFloat(s.stats?.avgScore) || 0), 0) / students.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tests Taken</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.reduce((sum, s) => sum + (s.stats?.testsTaken || 0), 0)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, CNIC, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Students</option>
                <option value="active">Active Students</option>
                <option value="inactive">Inactive Students</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Found <span className="font-semibold text-blue-600">{filteredStudents.length}</span> students
          </p>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests Taken</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentStudents.map((student) => {
                  const performance = getPerformanceBadge(parseFloat(student.stats?.avgScore) || 0);
                  const avgScore = parseFloat(student.stats?.avgScore) || 0;
                  
                  return (
                    <tr key={student.id || student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {student.name?.charAt(0).toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div>{student.phone || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{student.cnic || 'No CNIC'}</div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{student.stats?.testsTaken || 0}</span>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${getPerformanceColor(avgScore)}`}>
                            {avgScore}%
                          </span>
                          <TrendingUp className={`h-4 w-4 ${getPerformanceColor(avgScore)}`} />
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${performance.color}`}>
                          {performance.text}
                        </span>
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewStudentResults(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Results"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => downloadStudentReport(student)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download Report"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                       </td>
                     </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Student Results Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                <p className="text-blue-100 text-sm">{selectedStudent.email}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {/* Student Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">CNIC</p>
                  <p className="font-medium text-sm">{selectedStudent.cnic || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-sm">{selectedStudent.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Tests Taken</p>
                  <p className="font-medium text-2xl text-blue-600">{studentResults.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Avg Score</p>
                  <p className="font-medium text-2xl text-green-600">
                    {studentResults.length > 0 
                      ? (studentResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / studentResults.length).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Performance Summary */}
              {studentResults.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Performance Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {studentResults.filter(r => r.status === 'pass').length}
                      </p>
                      <p className="text-xs text-gray-500">Tests Passed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {studentResults.filter(r => r.status === 'fail').length}
                      </p>
                      <p className="text-xs text-gray-500">Tests Failed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {studentResults.length > 0 
                          ? (studentResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / studentResults.length).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-xs text-gray-500">Average Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.max(...studentResults.map(r => r.percentage || 0), 0)}%
                      </p>
                      <p className="text-xs text-gray-500">Highest Score</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results List */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
              <div className="space-y-3">
                {studentResults.length > 0 ? (
                  studentResults.map((result, idx) => (
                    <div key={result._id || idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{result.testTitle || 'Test'}</h4>
                          <p className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{result.completedAt ? new Date(result.completedAt).toLocaleDateString() : 'N/A'}</span>
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          result.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Score</p>
                          <p className="font-medium">{result.obtainedMarks}/{result.totalMarks}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Percentage</p>
                          <p className={`font-medium ${getPerformanceColor(result.percentage || 0)}`}>
                            {result.percentage || 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rank</p>
                          <p className="font-medium">{result.rank || 'N/A'}</p>
                        </div>
                      </div>
                      {!result.emailed && (
                        <button
                          onClick={() => resendResultEmail(result._id)}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Mail className="h-3 w-3" />
                          <span>Resend Result Email</span>
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No results found for this student</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;