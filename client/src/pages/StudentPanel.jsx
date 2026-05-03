import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Award, User, Settings,
  LogOut, Menu, X, Bell, GraduationCap, Calendar,
  Clock, CheckCircle, TrendingUp, MessageCircle, Home,
  FileText, Activity, CircleCheckBig, CircleX, AlertCircle, Brain
} from 'lucide-react';
import axios from 'axios';
import StudentDashboard from '../components/student/StudentDashboard';
import AvailableTests from '../components/student/AvailableTests';
import ApplyForTest from '../components/student/ApplyForTest';
import TestInterface from '../components/student/TestInterface';
import TestResult from '../components/student/TestResult';
import StudentProfile from '../components/student/StudentProfile';
import SettingsPage from '../components/student/Settings';

const StudentPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchNotifications();
    fetchRecentActivity();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/students/recent-activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentActivity(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/students/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const notificationsList = response.data.notifications || [];
      
      // Get read status from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
      
      // Mark notifications as read based on localStorage
      const notificationsWithReadStatus = notificationsList.map(notif => ({
        ...notif,
        read: readNotifications[notif.id] || false
      }));
      
      setNotifications(notificationsWithReadStatus);
      const unread = notificationsWithReadStatus.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Update badge in tab
      if (unread > 0) {
        document.title = `(${unread}) AINTS Student Portal`;
      } else {
        document.title = 'AINTS Student Portal';
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    // Store read status in localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    readNotifications[notificationId] = true;
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Optional: Call backend to mark as read
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/students/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    } catch (error) {
      // Silently fail
    }
  };

  const markAllAsRead = () => {
    const readNotifications = {};
    notifications.forEach(notif => {
      readNotifications[notif.id] = true;
    });
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
    
    const token = localStorage.getItem('token');
    axios.put('http://localhost:5000/api/students/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.type === 'result') {
      navigate(`/student/result/${notification.id}`);
    } else if (notification.type === 'application') {
      navigate('/student/tests');
    }
    setShowNotifications(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/tests', icon: BookOpen, label: 'Available Tests' },
    { path: '/student/my-results', icon: Award, label: 'My Results' },
    { path: '/student/profile', icon: User, label: 'Profile' },
    { path: '/student/settings', icon: Settings, label: 'Settings' },
  ];

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'result':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'application':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (date) => {
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

  const clearOldReadNotifications = () => {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    const entries = Object.entries(readNotifications);
    if (entries.length > 50) {
      const newRead = Object.fromEntries(entries.slice(-50));
      localStorage.setItem('readNotifications', JSON.stringify(newRead));
    }
  };

  useEffect(() => {
    clearOldReadNotifications();
  }, []);

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
                <Brain className="h-6 w-6 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS</span>
                  <p className="text-xs text-gray-500 -mt-1">Student Portal</p>
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
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500">Student</p>
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS Student Portal</h1>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl hover:bg-gray-100 relative transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center px-1 shadow-md">
                      {unreadCount > 99 ? '99+' : unreadCount}
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
                        {unreadCount > 0 && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">
                                  {notification.title || notification.type}
                                </p>
                                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
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
                  <p className="text-xs text-gray-500">Student</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<StudentDashboard />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/tests" element={<AvailableTests />} />
            <Route path="/apply/:testId" element={<ApplyForTest />} />
            <Route path="/take-test/:testId" element={<TestInterface />} />
            <Route path="/result/:resultId" element={<TestResult />} />
            <Route path="/my-results" element={<StudentDashboard />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/settings" element={<SettingsPage />} /> 
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default StudentPanel;