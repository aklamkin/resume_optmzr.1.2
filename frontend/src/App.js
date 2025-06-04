import React, { useState, useRef, useCallback } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [optimizedResume, setOptimizedResume] = useState('');
  
  // Resizable panels state
  const [panelWidths, setPanelWidths] = useState([33.33, 33.33, 33.33]); // percentages
  const [isResizing, setIsResizing] = useState(false);
  const [resizeIndex, setResizeIndex] = useState(null);
  const containerRef = useRef(null);
  
  // Cover letter state
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [coverLetterShort, setCoverLetterShort] = useState('');
  const [coverLetterLong, setCoverLetterLong] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('short'); // 'short' or 'long'
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  
  // Ratings popup state
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);

  // Handle panel resizing
  const handleMouseDown = useCallback((index) => (e) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeIndex(index);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || resizeIndex === null || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    const mousePercent = (mouseX / containerWidth) * 100;

    const newWidths = [...panelWidths];
    const totalOtherPanels = 100 - mousePercent;
    
    if (resizeIndex === 0) {
      // Resizing between first and second panel
      const remainingWidth = 100 - mousePercent;
      const ratio = newWidths[2] / (newWidths[1] + newWidths[2]);
      
      newWidths[0] = Math.max(15, Math.min(70, mousePercent));
      newWidths[1] = remainingWidth * (1 - ratio);
      newWidths[2] = remainingWidth * ratio;
    } else if (resizeIndex === 1) {
      // Resizing between second and third panel
      const firstPanelWidth = newWidths[0];
      const availableWidth = 100 - firstPanelWidth;
      const secondPanelPercent = ((mouseX / containerWidth) * 100) - firstPanelWidth;
      
      newWidths[1] = Math.max(15, Math.min(availableWidth - 15, secondPanelPercent));
      newWidths[2] = availableWidth - newWidths[1];
    }

    setPanelWidths(newWidths);
  }, [isResizing, resizeIndex, panelWidths]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeIndex(null);
  }, []);

  // Add event listeners
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

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

  // Generate cover letter
  const generateCoverLetter = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      alert('Resume and job description are required to generate a cover letter');
      return;
    }

    setIsGeneratingCoverLetter(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          resume_text: optimizedResume || resumeText, // Use optimized version if available
        }),
      });

      if (!response.ok) throw new Error('Cover letter generation failed');

      const result = await response.json();
      setCoverLetterShort(result.short_version || '');
      setCoverLetterLong(result.long_version || '');
      setShowCoverLetter(true);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Cover letter generation failed. Please try again.');
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  // Download cover letter
  const downloadCoverLetter = () => {
    const element = document.createElement('a');
    const coverLetterText = selectedVersion === 'short' ? coverLetterShort : coverLetterLong;
    const fileName = selectedVersion === 'short' ? 'cover_letter_short.txt' : 'cover_letter_long.txt';
    const file = new Blob([coverLetterText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
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
    setPanelWidths([33.33, 33.33, 33.33]); // Reset panel widths
    setCoverLetterShort('');
    setCoverLetterLong('');
    setSelectedVersion('short');
    setShowCoverLetter(false);
  };

  // Parse analysis data safely
  const getAnalysisData = () => {
    if (!analysisResult?.analysis) return null;
    
    try {
      let parsed;
      if (typeof analysisResult.analysis === 'string') {
        parsed = JSON.parse(analysisResult.analysis);
      } else {
        parsed = analysisResult.analysis;
      }
      return {
        suggestions: parsed.suggestions || [],
        skillsGap: parsed.skills_gap || [],
        atsKeywords: parsed.ats_keywords || [],
        overallScore: parsed.overall_score || "Not available"
      };
    } catch (error) {
      console.error('Error parsing analysis data:', error);
      return {
        suggestions: [],
        skillsGap: [],
        atsKeywords: [],
        overallScore: "Analysis data unavailable"
      };
    }
  };

  // Show rating popup
  const showRatingDetails = (ratingType) => {
    const analysisData = getAnalysisData();
    if (!analysisData) return;

    let popupData = {};
    
    if (ratingType === 'skills') {
      popupData = {
        title: 'Skills Gap Analysis',
        description: 'Skills mentioned in the job description that are missing or underrepresented in your resume.',
        items: analysisData.skillsGap,
        recommendation: analysisData.skillsGap.length > 0 
          ? 'Add these skills to your resume if you have experience with them, or consider gaining experience in these areas.'
          : 'Great! Your resume covers the key skills mentioned in the job description.',
        type: 'skills'
      };
    } else if (ratingType === 'ats') {
      popupData = {
        title: 'ATS Keywords Optimization',
        description: 'Important keywords from the job description that help your resume pass Applicant Tracking Systems (ATS).',
        items: analysisData.atsKeywords,
        recommendation: 'Incorporate these keywords naturally throughout your resume, especially in the skills and experience sections.',
        type: 'keywords'
      };
    } else if (ratingType === 'score') {
      popupData = {
        title: 'Overall Resume Score',
        description: analysisData.overallScore,
        items: [],
        recommendation: 'Review the AI suggestions and apply relevant changes to improve your score.',
        type: 'score'
      };
    }
    
    setSelectedRating(popupData);
    setShowRatingPopup(true);
  };

  // Parse suggestions safely (keep existing function but use new parsing)
  const getSuggestions = () => {
    const analysisData = getAnalysisData();
    return analysisData ? analysisData.suggestions : [];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">AI Resume Optimizer</h1>
          <p className="text-gray-600 mt-2">Free tool to optimize your resume for any job description</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!analysisResult ? (
          /* Input Form */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-6xl">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Optimize Your Resume</h2>
                
                <div className="grid md:grid-cols-2 gap-6 h-96">
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Resume *
                    </label>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your current resume text here..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
          </div>
        ) : (
          /* Results View */
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            {/* Header with actions and ratings */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
                <div className="space-x-3">
                  <button
                    onClick={downloadResume}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 text-sm"
                  >
                    Download Resume
                  </button>
                  <button
                    onClick={generateCoverLetter}
                    disabled={isGeneratingCoverLetter}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 text-sm disabled:opacity-50"
                  >
                    {isGeneratingCoverLetter ? 'Generating...' : 'Generate Cover Letter'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 text-sm"
                  >
                    Start Over
                  </button>
                </div>
              </div>

              {/* Rating Cards */}
              <div className="grid grid-cols-3 gap-4">
                {/* Skills Gap */}
                <div 
                  onClick={() => showRatingDetails('skills')}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-blue-900">Skills Gap</h3>
                    <span className="text-xs text-blue-600">Click for details</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {getAnalysisData()?.skillsGap?.length || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {getAnalysisData()?.skillsGap?.length === 0 ? 'No gaps found' : 'Missing skills'}
                  </p>
                </div>

                {/* ATS Keywords */}
                <div 
                  onClick={() => showRatingDetails('ats')}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-green-900">ATS Keywords</h3>
                    <span className="text-xs text-green-600">Click for details</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {getAnalysisData()?.atsKeywords?.length || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Important keywords
                  </p>
                </div>

                {/* Overall Score */}
                <div 
                  onClick={() => showRatingDetails('score')}
                  className="bg-purple-50 border border-purple-200 rounded-lg p-4 cursor-pointer hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-purple-900">Overall Score</h3>
                    <span className="text-xs text-purple-600">Click for details</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {getAnalysisData()?.overallScore?.match(/\d+/) ? 
                      getAnalysisData().overallScore.match(/\d+/)[0] + '/100' : 
                      'N/A'
                    }
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Resume match
                  </p>
                </div>
              </div>
            </div>

            {/* Resizable Panels */}
            <div 
              ref={containerRef}
              className="flex-1 flex bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ minHeight: '500px' }}
            >
              {/* Original Resume Panel */}
              <div 
                className="flex flex-col border-r border-gray-200"
                style={{ width: `${panelWidths[0]}%` }}
              >
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Original Resume</h3>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {resumeText}
                  </pre>
                </div>
              </div>

              {/* Resize Handle 1 */}
              <div
                className="w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors flex-shrink-0"
                onMouseDown={handleMouseDown(0)}
              />

              {/* AI Suggestions Panel */}
              <div 
                className="flex flex-col border-r border-gray-200"
                style={{ width: `${panelWidths[1]}%` }}
              >
                <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">
                    AI Suggestions ({getSuggestions().length})
                  </h3>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <div className="space-y-3">
                    {getSuggestions().map((suggestion, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded">
                            {suggestion.section || 'general'}
                          </span>
                          <button
                            onClick={() => toggleSuggestion(index, suggestion)}
                            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
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
              </div>

              {/* Resize Handle 2 */}
              <div
                className="w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors flex-shrink-0"
                onMouseDown={handleMouseDown(1)}
              />

              {/* Optimized Resume Panel */}
              <div 
                className="flex flex-col"
                style={{ width: `${panelWidths[2]}%` }}
              >
                <div className="bg-green-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Optimized Resume</h3>
                </div>
                <div className="flex-1 p-4 overflow-auto">
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
      <div className="bg-white border-t flex-shrink-0">
        <div className="container mx-auto px-6 py-3 text-center text-gray-600 text-sm">
          <p>Free AI-powered resume optimization tool • Drag the dividers to resize panels</p>
        </div>
      </div>

      {/* Cover Letter Modal */}
      {showCoverLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">Generated Cover Letter</h2>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedVersion('short')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      selectedVersion === 'short'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Short (~250 words)
                  </button>
                  <button
                    onClick={() => setSelectedVersion('long')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      selectedVersion === 'long'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Long (Full page)
                  </button>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={downloadCoverLetter}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 text-sm"
                >
                  Download {selectedVersion === 'short' ? 'Short' : 'Long'}
                </button>
                <button
                  onClick={() => setShowCoverLetter(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-auto">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                  {selectedVersion === 'short' ? coverLetterShort : coverLetterLong}
                </pre>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                {selectedVersion === 'short' 
                  ? 'Concise version perfect for quick applications and online forms'
                  : 'Comprehensive version with detailed examples and full context'
                } • Review and customize before sending
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;