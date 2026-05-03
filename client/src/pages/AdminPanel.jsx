import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Sparkles, Settings, Users,
  Award, BarChart3, LogOut, Menu, X, Bell, ChevronRight,
  Upload, Eye, Download, Calendar, Clock, CheckCircle, AlertCircle,
  PlusCircle, ListChecks, Megaphone, UserCheck, Database, Brain,
  Shield, TrendingUp, Activity, Target, Zap, Crown
} from 'lucide-react';
import AdminDashboard from '../components/admin/AdminDashboard';
import TestUploader from '../components/admin/TestUploader';
import AITestGenerator from '../components/admin/AITestGenerator';
import TestManagement from '../components/admin/TestManagement';
import ResultAnnouncement from '../components/admin/ResultAnnouncement';
import StudentResults from '../components/admin/StudentResults';
import Reports from '../components/admin/Reports';
import AdminSettings from '../components/admin/AdminSettings';
import Applications from '../components/admin/Applications';
import axios from 'axios';

const AdminPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notificationsList = response.data.notifications || [];
      setNotifications(notificationsList);
      setNotificationCount(notificationsList.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/upload', icon: Upload, label: 'Upload Test' },
    { path: '/admin/ai-generate', icon: Sparkles, label: 'AI Generator' },
    { path: '/admin/tests', icon: FileText, label: 'Manage Tests' },
    { path: '/admin/applications', icon: Users, label: 'Applications' },
    { path: '/admin/results', icon: Megaphone, label: 'Results' },
    { path: '/admin/student-results', icon: UserCheck, label: 'Student Results' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const formatTime = (date) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Sidebar - AINTS Theme */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-white shadow-xl border-r border-gray-100`}>
        <div className="flex flex-col h-full">
          {/* Logo - AINTS Branding */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className={`flex items-center space-x-2 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                <Brain className="h-7 w-7 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS</span>
                  <p className="text-xs text-gray-500 -mt-1">Admin Portal</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 transition text-gray-500"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 overflow-y-auto">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${!sidebarOpen && 'justify-center'}`
                    }
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'} space-x-3`}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              )}
              {sidebarOpen && (
                <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-red-500">
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS Admin Portal</h1>
              <p className="text-xs text-gray-500 mt-0.5">AI Integrated National Testing Service</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl hover:bg-gray-100 relative transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center px-1 shadow-md animate-pulse">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {notificationCount > 0 && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {notificationCount} new
                          </span>
                        )}
                      </div>
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div key={notification.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {notification.type === 'test' && <FileText className="h-4 w-4 text-blue-500" />}
                                {notification.type === 'result' && <Award className="h-4 w-4 text-green-500" />}
                                {notification.type === 'application' && <Users className="h-4 w-4 text-purple-500" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatTime(notification.time)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No notifications</p>
                          <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/upload" element={<TestUploader />} />
            <Route path="/ai-generate" element={<AITestGenerator />} />
            <Route path="/tests" element={<TestManagement />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/results" element={<ResultAnnouncement />} />
            <Route path="/student-results" element={<StudentResults />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;