import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, CheckCircle, XCircle, Clock, Eye,
  Search, Filter, RefreshCw, AlertCircle, Mail, Calendar,
  UserCheck, UserX, MessageSquare, Award, BookOpen
} from 'lucide-react';
import axios from 'axios';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let appsData = [];
      if (response.data.applications) {
        appsData = response.data.applications;
      } else if (Array.isArray(response.data)) {
        appsData = response.data;
      }
      
      setApplications(appsData);
      setFilteredApps(appsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
      setFilteredApps([]);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.testTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    setFilteredApps(filtered);
  };

  const handleApprove = (app) => {
    setSelectedApp({ ...app, action: 'approved' });
    setShowModal(true);
  };

  const handleReject = (app) => {
    setSelectedApp({ ...app, action: 'rejected' });
    setShowModal(true);
  };

  const viewDetails = (app) => {
    setSelectedApp(app);
    setShowDetailsModal(true);
  };

  const submitDecision = async () => {
    if (!selectedApp) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/applications/${selectedApp._id}`, {
        status: selectedApp.action,
        remarks: remarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Application ${selectedApp.action} successfully!`);
      setShowModal(false);
      setRemarks('');
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Error processing application:', error);
      alert(error.response?.data?.message || 'Failed to process application');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>;
    }
  };

  const getStatusCount = (status) => {
    return applications.filter(a => a.status === status).length;
  };

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Applications</h1>
            <p className="text-gray-600 mt-2">Review and manage student test applications</p>
          </div>
          <button
            onClick={fetchApplications}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{getStatusCount('pending')}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{getStatusCount('approved')}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{getStatusCount('rejected')}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, email or test title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApps.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {app.studentName?.charAt(0).toUpperCase() || 'S'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{app.studentName}</p>
                          <p className="text-sm text-gray-500">{app.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{app.testTitle}</p>
                        <p className="text-sm text-gray-500">Total Marks: {app.totalMarks}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDetails(app)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(app)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(app)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No applications found</p>
            </div>
          )}
        </div>
      </div>

      {/* Approval/Rejection Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-scaleIn">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                selectedApp.action === 'approved' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {selectedApp.action === 'approved' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedApp.action === 'approved' ? 'Approve Application' : 'Reject Application'}
              </h3>
              <p className="text-gray-600 mt-2">
                {selectedApp.action === 'approved' 
                  ? `Are you sure you want to approve ${selectedApp.studentName}'s application for ${selectedApp.testTitle}?`
                  : `Are you sure you want to reject ${selectedApp.studentName}'s application for ${selectedApp.testTitle}?`
                }
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add any remarks or feedback for the student..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setRemarks('');
                  setSelectedApp(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitDecision}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition ${
                  selectedApp.action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {selectedApp.action === 'approved' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span>{selectedApp.action === 'approved' ? 'Approve' : 'Reject'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {showDetailsModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Application Details</h3>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="font-medium">{selectedApp.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Student Email</p>
                    <p className="font-medium">{selectedApp.studentEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Test Title</p>
                    <p className="font-medium">{selectedApp.testTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Marks</p>
                    <p className="font-medium">{selectedApp.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Application Date</p>
                    <p className="font-medium">{new Date(selectedApp.appliedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Status</p>
                    <p className="font-medium">{getStatusBadge(selectedApp.status)}</p>
                  </div>
                </div>
                {selectedApp.remarks && (
                  <div>
                    <p className="text-sm text-gray-500">Remarks</p>
                    <p className="font-medium text-gray-700 bg-gray-50 p-2 rounded">{selectedApp.remarks}</p>
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

export default Applications;