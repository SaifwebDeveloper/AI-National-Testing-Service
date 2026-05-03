import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Shield, Mail, Award, Clock, Users, 
  ChevronRight, CheckCircle, BarChart3, BookOpen, 
  Video, FileText, GraduationCap, Building, 
  TrendingUp, Globe, Zap, Headphones, Star, Menu, X,
  Brain, Target, BadgeCheck, Microscope
} from 'lucide-react';

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.fade-on-scroll');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100;
        if (isVisible) {
          el.classList.add('opacity-100', 'translate-y-0');
          el.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Test Generation',
      description: 'Upload PDF or Word documents and let AI automatically generate high-quality MCQs in seconds.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Video,
      title: 'Advanced Anti-Cheating',
      description: 'Webcam monitoring, tab switching detection, and copy-paste prevention ensure exam integrity.',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Mail,
      title: 'Instant Result Notification',
      description: 'Results are automatically calculated and sent to students via email immediately after announcement.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Comprehensive reports and insights on student performance, question difficulty, and more.',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Clock,
      title: 'Real-Time Monitoring',
      description: 'Monitor student activity in real-time with live dashboards and cheating alerts.',
      color: 'from-rose-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with encrypted data, secure authentication, and regular backups.',
      color: 'from-violet-500 to-purple-500'
    }
  ];

  const stats = [
    { value: '50,000+', label: 'Active Students', icon: Users },
    { value: '500+', label: 'Institutions', icon: Building },
    { value: '98%', label: 'Satisfaction', icon: Star },
    { value: '1M+', label: 'Tests Conducted', icon: BookOpen }
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Ahmed',
      role: 'University Dean',
      content: 'This platform has revolutionized how we conduct examinations. The AI test generation saves hours of manual work.',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    {
      name: 'Prof. Muhammad Khan',
      role: 'Exam Controller',
      content: 'The anti-cheating system is incredibly effective. We have seen a dramatic reduction in malpractice cases.',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/men/2.jpg'
    },
    {
      name: 'Ayesha Malik',
      role: 'Student',
      content: 'The interface is very user-friendly and the instant results feature is amazing. Highly recommended!',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/women/3.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS</span>
                <span className="text-xs text-gray-500 block -mt-1">AI Integrated NTS</span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition">Home</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition">About</Link>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium transition">Login</Link>
              <Link
                to="/register"
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-3">
                <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium py-2">Home</Link>
                <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium py-2">About</Link>
                <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium py-2">Login</Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-white"></div>
        
        {/* Subtle geometric patterns */}
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
              <pattern id="hexagons" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                <path d="M30,0 L60,15 L60,45 L30,60 L0,45 L0,15 Z" fill="none" stroke="#60A5FA" strokeWidth="0.8" opacity="0.4"/>
                <path d="M30,30 L60,45 M30,30 L0,45 M30,30 L30,60" stroke="#93C5FD" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="#3B82F6" opacity="0.15"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#hexagons)" />
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100/80 backdrop-blur-sm mb-6 border border-blue-200/50">
              <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700 font-medium">AI-Powered Testing Platform</span>
            </div>
            
            {/* Main Title - Professional & Beautiful */}
            <div className="mb-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  AINTS
                </span>
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <p className="text-base md:text-lg text-gray-600 tracking-wide">
                  AI Integrated National Testing Service
                </p>
                <Target className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Revolutionizing examinations with AI-powered test generation, 
              real-time proctoring, and instant result analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 inline-flex items-center justify-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 bg-white text-blue-600 rounded-xl font-semibold border border-blue-200 hover:shadow-lg transition-all inline-flex items-center justify-center space-x-2 hover:bg-blue-50"
              >
                <span>Sign In</span>
              </Link>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center fade-on-scroll opacity-0 translate-y-10 transition-all duration-700 bg-white/40 backdrop-blur-sm rounded-2xl py-4 px-2 border border-white/60 shadow-sm" style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
              <BadgeCheck className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AINTS</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cutting-edge features that redefine online examination standards
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 fade-on-scroll opacity-0 translate-y-10 border border-gray-100"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className={`bg-gradient-to-r ${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AINTS</span> Works
            </h2>
            <p className="text-xl text-gray-600">Simple, fast, and efficient process</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Documents',
                description: 'Upload PDF or Word documents containing test material',
                icon: FileText
              },
              {
                step: '02',
                title: 'AI Generates Test',
                description: 'Our AI automatically creates MCQs with answer keys',
                icon: Sparkles
              },
              {
                step: '03',
                title: 'Students Take Test',
                description: 'Students take the test with real-time proctoring',
                icon: Users
              },
              {
                step: '04',
                title: 'Auto-Evaluation',
                description: 'System automatically grades answers instantly',
                icon: CheckCircle
              },
              {
                step: '05',
                title: 'Instant Results',
                description: 'Results are calculated and sent via email',
                icon: Mail
              },
              {
                step: '06',
                title: 'Analytics & Reports',
                description: 'Detailed performance analytics and insights',
                icon: TrendingUp
              }
            ].map((item, idx) => (
              <div key={idx} className="relative group fade-on-scroll opacity-0 translate-y-10 transition-all duration-700" style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 group-hover:border-blue-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-100 to-indigo-100 bg-clip-text text-transparent mb-4">{item.step}</div>
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {idx < 5 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anti-Cheating Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="fade-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 mb-4">
                <Shield className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-700 font-medium">Advanced Security</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Comprehensive Anti-Cheating System
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Our multi-layered security ensures exam integrity with real-time monitoring and automated detection.
              </p>
              <ul className="space-y-4">
                {[
                  'Webcam monitoring with face detection',
                  'Tab switching and window focus tracking',
                  'Copy-paste and right-click prevention',
                  'Multiple person detection',
                  'Mobile phone detection',
                  'Automated penalty system with warnings'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative fade-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-200">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 shadow-2xl">
                <div className="bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-400 ml-2">Monitoring Active</span>
                  </div>
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
                    <Video className="h-16 w-16 text-gray-600" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Face Detection:</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tab Focus:</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cheating Alerts:</span>
                      <span className="text-yellow-400">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Educational Leaders
            </h2>
            <p className="text-xl text-gray-600">What our clients say about AINTS</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all fade-on-scroll opacity-0 translate-y-10 border border-gray-100"
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Brain className="h-12 w-12 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Examination Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of educational institutions using AINTS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all inline-flex items-center justify-center space-x-2"
            >
              <Headphones className="h-5 w-5" />
              <span>Contact Sales</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-1.5 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">AINTS</span>
                  <p className="text-xs text-gray-400">AI Integrated NTS</p>
                </div>
              </div>
              <p className="text-sm">Revolutionizing online examinations with AI-powered technology.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 AINTS - AI Integrated National Testing Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;