import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [aiConfig, setAiConfig] = useState(null);
  const [relationshipCodes, setRelationshipCodes] = useState([]);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [relationshipCode, setRelationshipCode] = useState('');
  const [codeStatus, setCodeStatus] = useState('');
  const [downloadEligibility, setDownloadEligibility] = useState(null);

  // Check relationship code
  const checkRelationshipCode = async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/relationship-codes/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      if (!response.ok) throw new Error('Failed to check code');
      return await response.json();
    } catch (error) {
      console.error('Error checking relationship code:', error);
      return { valid: false, message: 'Error checking code' };
    }
  };

  // Apply relationship code
  const applyRelationshipCode = async (userId, code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/apply-relationship-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      if (!response.ok) throw new Error('Failed to apply code');
      return await response.json();
    } catch (error) {
      console.error('Error applying relationship code:', error);
      return { success: false, message: 'Error applying code' };
    }
  };

  // Check download eligibility
  const checkDownloadEligibility = async (userId, analysisId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/can-download/${analysisId}`);
      if (!response.ok) throw new Error('Failed to check download eligibility');
      return await response.json();
    } catch (error) {
      console.error('Error checking download eligibility:', error);
      return { can_download: false, reason: 'error' };
    }
  };

  // Process Apple Pay payment
  const processApplePayPayment = async (userId, analysisId, paymentToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/apple-pay/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_token: paymentToken,
          amount: 1.00,
          currency: 'USD',
          user_id: userId,
          analysis_id: analysisId,
        }),
      });

      if (!response.ok) throw new Error('Payment failed');
      return await response.json();
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  };
  const createUser = async (username, email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email }),
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      
      const result = await response.json();
      
      // Get the full user data
      const userResponse = await fetch(`${API_BASE_URL}/api/users/${result.user_id}`);
      const userData = await userResponse.json();
      
      setCurrentUser(userData);
      setCurrentView('dashboard');
      return userData;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  // Analyze resume
  const analyzeResume = async () => {
    if (!currentUser || !jobDescription.trim() || !resumeText.trim()) {
      alert('Please fill in both job description and resume text');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/analyze-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          resume_text: resumeText,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();
      setAnalysisResult(result);
      setCurrentView('results');
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load admin data
  const loadAdminData = async () => {
    try {
      // Load users
      const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users`);
      const usersData = await usersResponse.json();
      setUsers(usersData.users);

      // Load AI config
      const configResponse = await fetch(`${API_BASE_URL}/api/admin/config`);
      const configData = await configResponse.json();
      setAiConfig(configData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  // Update user status (admin)
  const updateUserStatus = async (userId, isFreee) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_free: isFreee }),
      });

      if (!response.ok) throw new Error('Failed to update user status');
      
      // Reload users
      await loadAdminData();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Resume Optimization
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your resume in seconds with cutting-edge AI analysis. Match any job description perfectly and beat ATS systems every time.
          </p>
          <div className="space-y-4 mb-12">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>AI-powered analysis in seconds</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>ATS-optimized suggestions</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Only $1 per optimized resume</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Have a relationship code? Get FREE access!</span>
            </div>
          </div>
          
          <button
            onClick={() => setCurrentView('signup')}
            className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Get Started Now
          </button>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
            <p className="text-gray-600">Get your optimized resume in under 30 seconds with our advanced AI engine.</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">ATS Optimized</h3>
            <p className="text-gray-600">Beat automated screening systems with keyword optimization and formatting.</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Affordable</h3>
            <p className="text-gray-600">Just $1 per download with Apple Pay. No subscriptions, no hidden fees.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Signup Component
  const SignupForm = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!username.trim() || !email.trim()) {
        alert('Please fill in all fields');
        return;
      }

      setLoading(true);
      try {
        await createUser(username, email);
      } catch (error) {
        alert('Failed to create account. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Start optimizing your resume today
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentView('landing')}
                className="text-indigo-600 hover:text-indigo-500 text-sm"
              >
                Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Dashboard Component
  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Resume Optimizer</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">{currentUser?.username}</span>
                {currentUser?.is_free && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    FREE
                  </span>
                )}
                {currentUser?.relationship_code && (
                  <span className="text-xs text-gray-500">
                    Code: {currentUser.relationship_code}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCurrentView('admin')}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Optimize Your Resume</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Resume Text *
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your current resume text here..."
                  className="w-full h-60 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <button
                onClick={analyzeResume}
                disabled={isLoading || !jobDescription.trim() || !resumeText.trim()}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Results Component
  const ResultsView = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [rawAnalysis, setRawAnalysis] = useState('');

    useEffect(() => {
      if (analysisResult?.analysis) {
        try {
          let parsed;
          let analysisText = analysisResult.analysis;
          
          // Store raw analysis for debugging
          setRawAnalysis(analysisText);
          
          if (typeof analysisText === 'string') {
            // Try to parse as JSON
            parsed = JSON.parse(analysisText);
          } else {
            parsed = analysisText;
          }
          setSuggestions(parsed.suggestions || []);
        } catch (error) {
          console.error('Error parsing analysis result:', error);
          console.log('Raw analysis:', analysisResult.analysis);
          // If JSON parsing fails, create a fallback structure
          setSuggestions([
            {
              section: "general",
              current_text: null,
              suggested_text: "AI analysis completed successfully. The system provided detailed suggestions for resume improvement.",
              reason: "Raw analysis result available in console for debugging"
            }
          ]);
        }
      }
    }, [analysisResult]);

    const applySuggestion = (index) => {
      // In a real implementation, this would update the resume text
      alert(`Applied suggestion ${index + 1}`);
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Back to Dashboard
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">{currentUser?.username}</span>
                  {currentUser?.is_free && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      FREE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Original Resume */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Original Resume</h3>
                <div className="bg-gray-50 p-4 rounded border h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {resumeText}
                  </pre>
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">AI Suggestions</h3>
                <div className="space-y-4 h-96 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-600 uppercase">
                          {suggestion.section}
                        </span>
                        <button
                          onClick={() => applySuggestion(index)}
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                        >
                          Apply
                        </button>
                      </div>
                      {suggestion.current_text && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Current:</p>
                          <p className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                            {suggestion.current_text}
                          </p>
                        </div>
                      )}
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Suggested:</p>
                        <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                          {suggestion.suggested_text}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 italic">
                        {suggestion.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Download Section */}
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Download Optimized Resume</h3>
                {currentUser?.is_free ? (
                  <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700">
                    Download Free (DOCX + PDF)
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">Download your optimized resume for $1</p>
                    <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
                      Pay $1 & Download (Apple Pay)
                    </button>
                  </div>
                )}
              </div>
              {/* Debug info for development */}
              {rawAnalysis && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Debug - Raw Analysis:</h4>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
                    {typeof rawAnalysis === 'string' ? rawAnalysis : JSON.stringify(rawAnalysis, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Admin Panel Component
  const AdminPanel = () => {
    const [editingConfig, setEditingConfig] = useState(false);
    const [configChanges, setConfigChanges] = useState({});

    useEffect(() => {
      if (currentView === 'admin') {
        loadAdminData();
      }
    }, [currentView]);

    const handleConfigSave = async () => {
      try {
        const updatedConfig = { ...aiConfig, ...configChanges };
        const response = await fetch(`${API_BASE_URL}/api/admin/config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedConfig),
        });

        if (!response.ok) throw new Error('Failed to save configuration');

        await loadAdminData();
        setEditingConfig(false);
        setConfigChanges({});
        alert('Configuration saved successfully!');
      } catch (error) {
        console.error('Error saving configuration:', error);
        alert('Failed to save configuration');
      }
    };

    const handleConfigChange = (provider, field, value) => {
      setConfigChanges(prev => ({
        ...prev,
        ai_configs: {
          ...prev.ai_configs,
          [provider]: {
            ...prev.ai_configs?.[provider],
            [field]: value
          }
        }
      }));
    };

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-gray-800 shadow">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-gray-300 hover:text-white"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* User Management */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relationship Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {user.username}
                          </span>
                          {user.is_free && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              FREE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_free ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.is_free ? 'FREE' : 'PAID'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.relationship_code || 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => updateUserStatus(user.id, !user.is_free)}
                          className={`${
                            user.is_free 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.is_free ? 'Make Paid' : 'Make Free'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">AI Configuration</h2>
            {aiConfig && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Provider
                  </label>
                  <select 
                    value={configChanges.default_provider || aiConfig.default_provider || 'gemini'}
                    onChange={(e) => setConfigChanges(prev => ({ ...prev, default_provider: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="gemini">Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="perplexity">Perplexity</option>
                  </select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
                    <button
                      onClick={() => setEditingConfig(!editingConfig)}
                      className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded hover:bg-indigo-200"
                    >
                      {editingConfig ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(aiConfig.ai_configs || {}).map(([provider, config]) => (
                      <div key={provider} className="flex items-center space-x-4">
                        <span className="w-20 text-sm font-medium text-gray-700 capitalize">
                          {provider}:
                        </span>
                        <input
                          type={editingConfig ? "text" : "password"}
                          value={
                            configChanges.ai_configs?.[provider]?.api_key !== undefined 
                              ? configChanges.ai_configs[provider].api_key 
                              : config.api_key || ''
                          }
                          onChange={(e) => handleConfigChange(provider, 'api_key', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="API Key"
                          disabled={!editingConfig}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {editingConfig && (
                  <div className="flex space-x-4">
                    <button 
                      onClick={handleConfigSave}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Save Configuration
                    </button>
                    <button 
                      onClick={() => {
                        setEditingConfig(false);
                        setConfigChanges({});
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render logic
  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'signup':
        return <SignupForm />;
      case 'dashboard':
        return <Dashboard />;
      case 'results':
        return <ResultsView />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <LandingPage />;
    }
  };

  return <div className="App">{renderCurrentView()}</div>;
}

export default App;