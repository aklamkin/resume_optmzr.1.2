import React, { useState } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [optimizedResume, setOptimizedResume] = useState('');

  // Analyze resume
  const analyzeResume = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      alert('Please fill in both job description and resume text');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
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
      setOptimizedResume(resumeText); // Start with original resume
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply or remove suggestion
  const toggleSuggestion = (index, suggestion) => {
    const newApplied = new Set(appliedSuggestions);
    
    if (appliedSuggestions.has(index)) {
      // Remove suggestion
      newApplied.delete(index);
      if (suggestion.current_text) {
        setOptimizedResume(prev => prev.replace(suggestion.suggested_text, suggestion.current_text));
      }
    } else {
      // Apply suggestion
      newApplied.add(index);
      if (suggestion.current_text) {
        setOptimizedResume(prev => prev.replace(suggestion.current_text, suggestion.suggested_text));
      } else {
        // Add new content
        setOptimizedResume(prev => `${prev}\n\n${suggestion.suggested_text}`);
      }
    }
    
    setAppliedSuggestions(newApplied);
  };

  // Download resume
  const downloadResume = () => {
    const element = document.createElement('a');
    const file = new Blob([optimizedResume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'optimized_resume.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Reset form
  const resetForm = () => {
    setJobDescription('');
    setResumeText('');
    setAnalysisResult(null);
    setAppliedSuggestions(new Set());
    setOptimizedResume('');
  };

  // Parse suggestions safely
  const getSuggestions = () => {
    if (!analysisResult?.analysis) return [];
    
    try {
      let parsed;
      if (typeof analysisResult.analysis === 'string') {
        parsed = JSON.parse(analysisResult.analysis);
      } else {
        parsed = analysisResult.analysis;
      }
      return parsed.suggestions || [];
    } catch (error) {
      console.error('Error parsing suggestions:', error);
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">AI Resume Optimizer</h1>
          <p className="text-gray-600 mt-2">Free tool to optimize your resume for any job description</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {!analysisResult ? (
          /* Input Form */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Optimize Your Resume</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Resume *
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your current resume text here..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={analyzeResume}
                  disabled={isLoading || !jobDescription.trim() || !resumeText.trim()}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="max-w-7xl mx-auto">
            {/* Header with actions */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                <div className="space-x-4">
                  <button
                    onClick={downloadResume}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
                  >
                    Download Resume
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Original Resume */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Original Resume</h3>
                <div className="bg-gray-50 p-4 rounded border h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {resumeText}
                  </pre>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  AI Suggestions ({getSuggestions().length})
                </h3>
                <div className="space-y-3 h-96 overflow-y-auto">
                  {getSuggestions().map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                          {suggestion.section || 'general'}
                        </span>
                        <button
                          onClick={() => toggleSuggestion(index, suggestion)}
                          className={`text-xs px-3 py-1 rounded font-medium ${
                            appliedSuggestions.has(index)
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {appliedSuggestions.has(index) ? 'Applied ✓' : 'Apply'}
                        </button>
                      </div>
                      
                      {suggestion.current_text && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Current:</p>
                          <p className="text-xs text-gray-700 bg-red-50 p-2 rounded border">
                            {suggestion.current_text}
                          </p>
                        </div>
                      )}
                      
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Suggested:</p>
                        <p className="text-xs text-gray-700 bg-green-50 p-2 rounded border">
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

              {/* Optimized Resume */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Optimized Resume</h3>
                <div className="bg-green-50 p-4 rounded border h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {optimizedResume}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="container mx-auto px-6 py-4 text-center text-gray-600">
          <p>Free AI-powered resume optimization tool</p>
        </div>
      </div>
    </div>
  );
}

export default App;