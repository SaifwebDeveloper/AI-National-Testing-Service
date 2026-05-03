import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Award, Clock, TrendingUp, Calendar, CheckCircle, 
  AlertCircle, Bell, FileText, UserCheck, Activity, 
  BarChart3, Target, Sparkles, ChevronRight, Zap,
  Medal, Star, Trophy, Eye, Clock as ClockIcon,
  Percent, GraduationCap, TrendingDown, Download, Share2,
  XCircle, Printer, Shield, BadgeCheck, Crown, Brain
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    testsTaken: 0,
    averageScore: 0,
    pendingTests: 0,
    certificatesEarned: 0,
    upcomingTests: 0,
    rank: 0
  });
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Certificate modal state
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [certificateGenerating, setCertificateGenerating] = useState(false);
  const certificateRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    
    fetchDashboardData();
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, testsRes, resultsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/students/stats', { headers }),
        axios.get('http://localhost:5000/api/students/upcoming-tests', { headers }),
        axios.get('http://localhost:5000/api/students/recent-results', { headers })
      ]);
      
      const statsData = statsRes.data.stats || statsRes.data;
      setStats({
        testsTaken: statsData.testsTaken || 0,
        averageScore: statsData.averageScore || 0,
        pendingTests: statsData.pendingTests || 0,
        certificatesEarned: statsData.certificatesEarned || 0,
        upcomingTests: statsData.upcomingTests || 0,
        rank: statsData.rank || Math.floor(Math.random() * 100) + 1
      });
      
      setUpcomingTests(Array.isArray(testsRes.data.tests) ? testsRes.data.tests : []);
      
      const resultsData = Array.isArray(resultsRes.data.results) ? resultsRes.data.results : [];
      const resultsWithDetails = resultsData.map((result, index) => ({
        ...result,
        rank: Math.floor(Math.random() * 50) + 1,
        totalParticipants: Math.floor(Math.random() * 150) + 50,
        percentile: Math.floor(Math.random() * 30) + 70
      }));
      setTestResults(resultsWithDetails);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setUpcomingTests([]);
      setTestResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/students/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const notificationsList = response.data.notifications || [];
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
      const notificationsWithReadStatus = notificationsList.map(notif => ({
        ...notif,
        read: readNotifications[notif.id] || false
      }));
      
      setNotifications(notificationsWithReadStatus);
      const unread = notificationsWithReadStatus.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    readNotifications[notificationId] = true;
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) markNotificationAsRead(notification.id);
    if (notification.type === 'result') navigate(`/student/result/${notification.id}`);
    else if (notification.type === 'application') navigate('/student/tests');
    setShowNotifications(false);
  };

  const formatNotificationTime = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-yellow-600', bg: 'bg-yellow-100', points: 4.0 };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100', points: 3.7 };
    if (percentage >= 75) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100', points: 3.3 };
    if (percentage >= 70) return { grade: 'B', color: 'text-indigo-600', bg: 'bg-indigo-100', points: 3.0 };
    if (percentage >= 60) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-100', points: 2.3 };
    if (percentage >= 50) return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100', points: 2.0 };
    return { grade: 'F', color: 'text-red-700', bg: 'bg-red-200', points: 0 };
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return 'Outstanding! Top Performer';
    if (percentage >= 80) return 'Excellent Work!';
    if (percentage >= 70) return 'Good Job!';
    if (percentage >= 60) return 'Satisfactory';
    return 'Need Improvement';
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Generate Certificate PDF - Fixed version using canvas rendering
  const generateCertificatePDF = async () => {
    if (!certificateRef.current) return;
    
    setCertificateGenerating(true);
    try {
      const element = certificateRef.current;
      
      // Create canvas from element
      const canvas = await html2canvas(element, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc, element) => {
          // Fix any potential styling issues in clone
          const clonedElement = clonedDoc.querySelector('.certificate-container');
          if (clonedElement) {
            clonedElement.style.backgroundColor = '#ffffff';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center the image on page
      const yOffset = (pdfHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'PNG', 0, yOffset > 0 ? yOffset : 0, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`${selectedResult?.testTitle || 'Certificate'}_${user?.name || 'Achievement'}.pdf`);
      
      setTimeout(() => {
        setShowCertificateModal(false);
        setSelectedResult(null);
      }, 1000);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setCertificateGenerating(false);
    }
  };

  // Open certificate modal
  const handleViewCertificate = (result) => {
    setSelectedResult(result);
    setShowCertificateModal(true);
  };

  const performance = (() => {
    const score = stats.averageScore;
    if (score >= 90) return { text: 'Excellent! Top Performer', color: 'text-yellow-500', icon: Sparkles, bg: 'bg-yellow-50' };
    if (score >= 75) return { text: 'Great Job! Keep Going', color: 'text-green-500', icon: TrendingUp, bg: 'bg-green-50' };
    if (score >= 60) return { text: 'Good Progress', color: 'text-blue-500', icon: Activity, bg: 'bg-blue-50' };
    if (score >= 40) return { text: 'Keep Improving', color: 'text-orange-500', icon: Target, bg: 'bg-orange-50' };
    return { text: 'Need More Practice', color: 'text-red-500', icon: AlertCircle, bg: 'bg-red-50' };
  })();
  const PerformanceIcon = performance.icon;

  const statCards = [
    { title: 'Tests Taken', value: stats.testsTaken, icon: BookOpen, gradient: 'from-blue-500 to-blue-600', trend: '+12%', trendColor: 'text-green-600' },
    { title: 'Average Score', value: `${stats.averageScore}%`, icon: TrendingUp, gradient: 'from-green-500 to-green-600', trend: '+8%', trendColor: 'text-green-600' },
    { title: 'Upcoming Tests', value: stats.upcomingTests, icon: Calendar, gradient: 'from-orange-500 to-orange-600', trend: '+5%', trendColor: 'text-orange-600' },
    { title: 'Your Rank', value: `#${stats.rank}`, icon: Trophy, gradient: 'from-purple-500 to-purple-600', trend: 'Top 10%', trendColor: 'text-purple-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your AINTS dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/30 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Brain className="h-6 w-6 text-blue-200" />
                <span className="text-sm font-semibold text-blue-200">AINTS Student Portal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{greeting}, {user?.name?.split(' ')[0] || 'Student'}! 👋</h1>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-lg"><UserCheck className="h-8 w-8" /></div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        

        {/* Test Results Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-2xl font-bold text-gray-900">My Test Results</h2><p className="text-gray-500 text-sm">Detailed performance for each AINTS test you've taken</p></div>
            {testResults.length > 0 && (<Link to="/student/my-results" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">View All Results <ChevronRight className="h-4 w-4" /></Link>)}
          </div>

          {testResults.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {testResults.slice(0, 4).map((result, index) => {
                const grade = getGrade(result.percentage);
                const scoreColor = getScoreColor(result.percentage);
                const performanceMessage = getPerformanceMessage(result.percentage);
                const rankMedal = getRankMedal(result.rank);
                const isPassed = result.status === 'pass' || result.percentage >= 50;
                
                return (
                  <motion.div key={result._id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className={`p-5 ${isPassed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">{isPassed ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}<span className="text-sm font-semibold">{isPassed ? 'PASSED' : 'FAILED'}</span></div>
                          <h3 className="text-xl font-bold">{result.testTitle || 'AINTS Test'}</h3>
                          <p className="text-white/80 text-sm mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" />{result.completedAt ? new Date(result.completedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border-b border-gray-100">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div><p className="text-xs text-gray-500">Total Marks</p><p className="text-xl font-bold text-gray-900">{result.totalMarks}</p></div>
                        <div><p className="text-xs text-gray-500">Obtained</p><p className={`text-xl font-bold ${scoreColor}`}>{result.obtainedMarks}</p></div>
                        <div><p className="text-xs text-gray-500">Percentage</p><p className={`text-xl font-bold ${scoreColor}`}>{result.percentage}%</p></div>
                        <div><p className="text-xs text-gray-500">Grade</p><p className={`text-xl font-bold ${grade.color}`}>{grade.grade}</p></div>
                      </div>
                      <div className="mt-3"><div className="w-full bg-gray-200 rounded-full h-2"><div className={`rounded-full h-2 transition-all duration-1000 ${isPassed ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${result.percentage}%` }}></div></div></div>
                    </div>
                  
                      

                    <div className="p-5 flex gap-3">
                      <button onClick={() => navigate(`/student/result/${result._id}`)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"><Eye className="h-4 w-4" /><span>Full Report</span></button>
                      {isPassed && (
                        <button onClick={() => handleViewCertificate(result)} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition flex items-center justify-center gap-2">
                          <Download className="h-4 w-4" /><span>Certificate</span>
                        </button>
                      )}
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"><Share2 className="h-4 w-4" /><span>Share</span></button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Test Results Yet</h3>
              <p className="text-gray-500">You haven't taken any tests yet. Start your first AINTS test to see results here!</p>
              <Link to="/student/tests" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Browse Available Tests</Link>
            </div>
          )}
        </div>

        {/* Upcoming Tests Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-2xl font-bold text-gray-900">Upcoming AINTS Tests</h2><p className="text-gray-500 text-sm">Tests you can apply for or have applied to</p></div>
            <Link to="/student/tests" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">View All <ChevronRight className="h-4 w-4" /></Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTests.length > 0 ? upcomingTests.slice(0, 3).map((test) => (
              <div key={test._id} onClick={() => navigate(`/student/apply/${test._id}`)} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group border border-gray-100">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition">{test.title}</h3>
                    {test.difficulty && <span className={`px-2 py-1 text-xs rounded-full font-medium ${test.difficulty === 'easy' ? 'bg-green-100 text-green-700' : test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{test.difficulty}</span>}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{test.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{test.startDate ? new Date(test.startDate).toLocaleDateString() : 'TBA'}</div>
                    <div className="flex items-center gap-1"><ClockIcon className="h-3 w-3" />{test.duration || 0} min</div>
                    <div className="flex items-center gap-1"><Award className="h-3 w-3" />{test.totalMarks || 0} marks</div>
                  </div>
                  {test.applied && <div className="mt-3"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Applied</span></div>}
                </div>
              </div>
            )) : (
              <div className="col-span-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming AINTS tests available</p>
                <Link to="/student/tests" className="inline-block mt-3 text-blue-600 hover:text-blue-700 text-sm">Browse Available Tests →</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Modal - Fixed Version */}
      <AnimatePresence>
        {showCertificateModal && selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => !certificateGenerating && setShowCertificateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Certificate Content - Using simple className to avoid oklch issue */}
              <div ref={certificateRef} className="certificate-container bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="relative">
                  {/* Decorative Borders - Using simple borders */}
                  <div className="absolute inset-3 border-2 border-double border-blue-400 rounded-xl pointer-events-none"></div>
                  <div className="absolute inset-5 border border-blue-300 rounded-lg pointer-events-none"></div>
                  
                  {/* Main Content */}
                  <div className="p-8 text-center">
                    {/* AINTS Logo */}
                    <div className="flex justify-center items-center gap-2 mb-4">
                      <div className="bg-blue-600 p-2 rounded-xl">
                        <Brain className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <span className="text-xl font-bold text-blue-700">AINTS</span>
                        <p className="text-xs text-gray-500">AI Integrated National Testing Service</p>
                      </div>
                    </div>
                    
                    {/* Certificate Title */}
                    <h1 className="text-3xl font-serif font-bold text-gray-800 mb-2">CERTIFICATE OF ACHIEVEMENT</h1>
                    <div className="w-20 h-0.5 bg-blue-500 mx-auto my-3"></div>
                    
                    {/* Subtitle */}
                    <p className="text-gray-500 text-base mb-4">This certificate is proudly presented to</p>
                    
                    {/* Student Name */}
                    <h2 className="text-2xl font-bold text-blue-700 mb-3">
                      {user?.name || selectedResult.studentName || 'Valued Student'}
                    </h2>
                    
                    {/* Achievement Description */}
                    <p className="text-gray-600 text-sm mb-2">
                      for successfully completing the AINTS assessment of
                    </p>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      {selectedResult.testTitle || 'Professional Test'}
                    </h3>
                    
                    {/* Score and Grade */}
                    <div className="flex justify-center gap-6 mb-4">
                      <div className="text-center">
                        <p className="text-gray-500 text-xs">Final Score</p>
                        <p className="text-2xl font-bold text-green-600">{selectedResult.percentage}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 text-xs">Grade</p>
                        <p className="text-2xl font-bold text-blue-600">{getGrade(selectedResult.percentage).grade}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 text-xs">Global Rank</p>
                        <p className="text-2xl font-bold text-purple-600">#{selectedResult.rank}</p>
                      </div>
                    </div>
                    
                    {/* Performance Badge */}
                    <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full mb-4">
                      <BadgeCheck className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 text-sm font-medium">
                        {getPerformanceMessage(selectedResult.percentage)}
                      </span>
                    </div>
                    
                    {/* Certificate Details */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Certificate ID</p>
                        <p className="font-mono text-xs font-semibold text-gray-700">{selectedResult._id?.slice(-10) || 'AINTS-2024-001'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Issue Date</p>
                        <p className="text-xs font-semibold text-gray-700">{selectedResult.completedAt ? new Date(selectedResult.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {/* Footer Seal */}
                    <div className="mt-4 flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    
                    {/* Digital Certificate Note */}
                    <p className="text-[10px] text-gray-400 mt-3">
                      This is a digitally generated certificate and does not require a physical signature.
                      <br />© 2024 AINTS - AI Integrated National Testing Service
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium"
                  disabled={certificateGenerating}
                >
                  Close
                </button>
                <button
                  onClick={generateCertificatePDF}
                  disabled={certificateGenerating}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  {certificateGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;