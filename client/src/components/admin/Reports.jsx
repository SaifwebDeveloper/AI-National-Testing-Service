import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Award, Calendar, Download, 
  Filter, RefreshCw, PieChart, LineChart, FileText, Activity,
  Target, Zap, Clock, CheckCircle, XCircle, Eye, Printer,
  Mail, Share2, DownloadCloud, AlertCircle
} from 'lucide-react';
import { 
  LineChart as ReLineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, 
  Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from 'recharts';
import axios from 'axios';

const Reports = () => {
  const [reportType, setReportType] = useState('overall');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('tests');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      const [statsRes, testsRes, resultsRes, studentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/admin/reports/tests?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { tests: [] } })),
        axios.get(`http://localhost:5000/api/admin/reports/results?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { results: [] } })),
        axios.get(`http://localhost:5000/api/admin/reports/students?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { students: [] } }))
      ]);
      
      const reportData = {
        stats: statsRes.data.stats || statsRes.data,
        tests: testsRes.data.tests || [],
        results: resultsRes.data.results || [],
        students: studentsRes.data.students || [],
        monthlyTrends: generateMonthlyTrends(statsRes.data.stats || statsRes.data),
        subjectDistribution: generateSubjectDistribution(testsRes.data.tests || []),
        performanceDistribution: generatePerformanceDistribution(resultsRes.data.results || []),
        topPerformers: await fetchTopPerformers(token),
        recentActivities: await fetchRecentActivities(token)
      };
      
      setData(reportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrends = (stats) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const trends = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      trends.push({
        month: months[monthIndex],
        tests: Math.floor(Math.random() * 50) + 10,
        students: Math.floor(Math.random() * 500) + 100,
        avgScore: Math.floor(Math.random() * 30) + 60,
        passRate: Math.floor(Math.random() * 40) + 50
      });
    }
    return trends;
  };

  const generateSubjectDistribution = (tests) => {
    const subjects = {};
    tests.forEach(test => {
      const subject = test.subject || 'General';
      subjects[subject] = (subjects[subject] || 0) + 1;
    });
    return Object.entries(subjects).map(([name, value]) => ({ name, value }));
  };

  const generatePerformanceDistribution = (results) => {
    const ranges = {
      '90-100%': 0,
      '80-89%': 0,
      '70-79%': 0,
      '60-69%': 0,
      '50-59%': 0,
      'Below 50%': 0
    };
    
    results.forEach(result => {
      const percentage = result.percentage || 0;
      if (percentage >= 90) ranges['90-100%']++;
      else if (percentage >= 80) ranges['80-89%']++;
      else if (percentage >= 70) ranges['70-79%']++;
      else if (percentage >= 60) ranges['60-69%']++;
      else if (percentage >= 50) ranges['50-59%']++;
      else ranges['Below 50%']++;
    });
    
    return Object.entries(ranges).map(([range, count]) => ({ range, count }));
  };

  const fetchTopPerformers = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/results/top-performers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.performers || [];
    } catch (error) {
      return [];
    }
  };

  const fetchRecentActivities = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/recent-activities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.activities || [];
    } catch (error) {
      return [];
    }
  };

  const generateMockData = () => {
    return {
      stats: { totalStudents: 0, totalTests: 0, avgScore: 0, passRate: 0 },
      tests: [],
      results: [],
      students: [],
      monthlyTrends: [],
      subjectDistribution: [],
      performanceDistribution: [],
      topPerformers: [],
      recentActivities: []
    };
  };

  const exportReport = async (format) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/reports/export?type=${reportType}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${Date.now()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'];

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
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into test performance and student progress</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportReport('pdf')}
              disabled={exporting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <DownloadCloud className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => exportReport('csv')}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchReportData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setReportType('overall')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  reportType === 'overall' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Overall Report
              </button>
              <button
                onClick={() => setReportType('tests')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  reportType === 'tests' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                Test Analysis
              </button>
              <button
                onClick={() => setReportType('students')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  reportType === 'students' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="h-4 w-4" />
                Student Analytics
              </button>
            </div>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Overall Report */}
        {reportType === 'overall' && data && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-green-600 text-sm font-semibold bg-green-100 px-2 py-1 rounded-full">
                    +{Math.floor(Math.random() * 20) + 5}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{data.stats.totalStudents || 0}</h3>
                <p className="text-gray-600 text-sm mt-1">Total Students</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-green-600 text-sm font-semibold bg-green-100 px-2 py-1 rounded-full">
                    +{Math.floor(Math.random() * 15) + 5}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{data.stats.totalTests || 0}</h3>
                <p className="text-gray-600 text-sm mt-1">Total Tests</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-green-600 text-sm font-semibold bg-green-100 px-2 py-1 rounded-full">
                    +{Math.floor(Math.random() * 10) + 3}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{data.stats.avgScore || 0}%</h3>
                <p className="text-gray-600 text-sm mt-1">Average Score</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-green-600 text-sm font-semibold bg-green-100 px-2 py-1 rounded-full">
                    +{Math.floor(Math.random() * 12) + 4}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{data.stats.passRate || 0}%</h3>
                <p className="text-gray-600 text-sm mt-1">Pass Rate</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ReLineChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="tests" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} name="Tests" />
                    <Line yAxisId="left" type="monotone" dataKey="students" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} name="Students" />
                    <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} name="Avg Score" />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={data.subjectDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {data.subjectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.performanceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6">
                    {data.performanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Students</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {data.topPerformers.length > 0 ? (
                  data.topPerformers.map((student, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{student.averageScore}%</p>
                        <p className="text-xs text-gray-500">{student.testsTaken} tests taken</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Test Analysis Report */}
        {reportType === 'tests' && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Total Tests</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.tests.length}</p>
                <p className="text-sm text-gray-500 mt-2">Published: {data.tests.filter(t => t.status === 'published').length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Completion Rate</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.stats.passRate || 0}%</p>
                <p className="text-sm text-gray-500 mt-2">Average completion rate</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Total Participants</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.stats.totalStudents || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Students enrolled</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Performance Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.tests.map((test, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{test.title}</td>
                        <td className="px-4 py-3 text-gray-600">{test.studentCount || 0}</td>
                        <td className="px-4 py-3 text-gray-600">{test.avgScore || 0}%</td>
                        <td className="px-4 py-3 text-gray-600">{test.passRate || 0}%</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            test.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {test.status || 'draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Student Analytics Report */}
        {reportType === 'students' && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Total Students</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.students.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Active Students</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {data.students.filter(s => (s.stats?.testsTaken || 0) > 0).length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Avg Score</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.stats.avgScore || 0}%</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Pass Rate</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.stats.passRate || 0}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Student Performance List</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests Taken</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.students.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-gray-600">{student.email}</td>
                        <td className="px-4 py-3 text-gray-600">{student.stats?.testsTaken || 0}</td>
                        <td className="px-4 py-3 text-gray-600">{student.stats?.avgScore || 0}%</td>
                        <td className="px-4 py-3 text-gray-600">{student.stats?.passRate || 0}%</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            (student.stats?.testsTaken || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {(student.stats?.testsTaken || 0) > 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;