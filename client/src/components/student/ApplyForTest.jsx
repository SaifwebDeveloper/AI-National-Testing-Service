import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, User, CreditCard, Calendar, Clock, Award, AlertCircle, CheckCircle, Upload, Loader, Mail, Phone, MapPin, BookOpen } from 'lucide-react';
import axios from 'axios';

const ApplyForTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cnic: '',
    fullName: '',
    email: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    education: '',
    experience: '',
    additionalInfo: ''
  });
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData(prev => ({
        ...prev,
        cnic: parsedUser.cnic || '',
        fullName: parsedUser.name || '',
        email: parsedUser.email || ''
      }));
    }
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTest(response.data.test || response.data);
    } catch (error) {
      console.error('Error fetching test:', error);
      navigate('/student/tests');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cnic) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^\d{13}$/.test(formData.cnic.replace(/-/g, ''))) {
      newErrors.cnic = 'CNIC must be 13 digits';
    }
    
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{11}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 11 digits';
    }
    
    if (!formData.education) {
      newErrors.education = 'Education information is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    
    const applicationData = {
      testId: testId,
      cnic: formData.cnic,
      fullName: formData.fullName,
      email: formData.email,
      dateOfBirth: formData.dateOfBirth,
      phone: formData.phone,
      address: formData.address,
      education: formData.education,
      experience: formData.experience,
      additionalInfo: formData.additionalInfo
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/tests/apply/${testId}`, applicationData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert('Application submitted successfully! You will be notified once approved.');
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Application error:', error);
      const errorMessage = error.response?.data?.message || 'Error submitting application. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Test Not Found</h2>
          <p className="text-gray-600 mt-2">The test you're looking for doesn't exist or has ended.</p>
          <button onClick={() => navigate('/student/tests')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Browse Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Test Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{test.title}</h1>
          <p className="text-gray-600 mb-4">{test.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{test.startDate ? new Date(test.startDate).toLocaleDateString() : 'TBA'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{test.duration || 0} minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Award className="h-4 w-4" />
              <span className="text-sm">{test.totalMarks || 0} marks</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <FileText className="h-4 w-4" />
              <span className="text-sm">MCQs Based</span>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Application Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC Number *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    placeholder="1234567890123"
                    maxLength="13"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.cnic ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="03001234567"
                    maxLength="11"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your complete address"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education / Qualification *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.education ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your educational background, degrees, certifications, etc."
                  />
                </div>
                {errors.education && <p className="text-red-500 text-xs mt-1">{errors.education}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Experience (Optional)
                </label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any relevant work experience"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Information (Optional)
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional information you'd like to share"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Application Guidelines</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Ensure all information is accurate and up-to-date</li>
                    <li>• You will receive a confirmation email upon application</li>
                    <li>• Applications are reviewed by administrators</li>
                    <li>• You will be notified once your application is approved</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/student/tests')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyForTest;