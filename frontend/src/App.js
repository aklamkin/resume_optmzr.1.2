import React, { useState, useRef, useCallback } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Simple geometric logo component (Nike-style)
const ResumeOptimizerLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M8 12 L16 8 L24 12 L16 16 Z M8 20 L16 16 L24 20 L16 24 Z" 
      fill="currentColor" 
      className="text-blue-600"
    />
    <circle cx="16" cy="16" r="2" fill="currentColor" className="text-blue-600" />
  </svg>
);

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [optimizedResume, setOptimizedResume] = useState('');
  const [isEditingResume, setIsEditingResume] = useState(false);
  
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

  // Progress tracking
  const initializeProgress = () => {
    const steps = [
      { id: 1, label: 'Preparing analysis...', status: 'pending' },
      { id: 2, label: 'Processing resume...', status: 'pending' },
      { id: 3, label: 'Analyzing job description...', status: 'pending' },
      { id: 4, label: 'AI optimization in progress...', status: 'pending' },
      { id: 5, label: 'Generating suggestions...', status: 'pending' },
      { id: 6, label: 'Finalizing results...', status: 'pending' }
    ];
    setProgressSteps(steps);
    setCurrentStep(0);
  };

  const updateProgress = (stepIndex, status = 'completed') => {
    setProgressSteps(prev => prev.map((step, index) => {
      if (index === stepIndex) {
        return { ...step, status };
      } else if (index < stepIndex) {
        return { ...step, status: 'completed' };
      }
      return step;
    }));
    setCurrentStep(stepIndex);
  };

  const simulateProgress = async () => {
    // Step 1: Preparing
    await new Promise(resolve => setTimeout(resolve, 500));
    updateProgress(0);
    
    // Step 2: Processing resume
    await new Promise(resolve => setTimeout(resolve, 800));
    updateProgress(1);
    
    // Step 3: Analyzing job description
    await new Promise(resolve => setTimeout(resolve, 600));
    updateProgress(2);
    
    // Step 4: AI processing (this is where the real work happens)
    updateProgress(3, 'active');
  };

  // Analyze resume
  const analyzeResume = async () => {
    if (!jobDescription.trim() || (!resumeText.trim() && !resumeFile)) {
      alert('Please provide both job description and resume (either text or file)');
      return;
    }

    setIsLoading(true);
    initializeProgress();
    
    try {
      // Start progress simulation
      simulateProgress();
      
      const formData = new FormData();
      formData.append('job_description', jobDescription);
      
      if (resumeFile) {
        formData.append('resume_file', resumeFile);
      } else {
        formData.append('resume_text', resumeText);
      }

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData, // Don't set Content-Type header, let browser set it for FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      // Step 5: Generating suggestions
      updateProgress(4);
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await response.json();
      
      // Step 6: Finalizing
      updateProgress(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalysisResult(result);
      
      // Set optimized resume from the extracted text
      setOptimizedResume(result.original_resume || resumeText);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProgressSteps([]);
      setCurrentStep(0);
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
    if (!jobDescription.trim() || (!resumeText.trim() && !resumeFile)) {
      alert('Job description and resume are required to generate a cover letter');
      return;
    }

    setIsGeneratingCoverLetter(true);
    try {
      const formData = new FormData();
      formData.append('job_description', jobDescription);
      
      if (resumeFile) {
        formData.append('resume_file', resumeFile);
      } else {
        formData.append('resume_text', optimizedResume || resumeText);
      }

      const response = await fetch(`${API_BASE_URL}/generate-cover-letter`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Cover letter generation failed');
      }

      const result = await response.json();
      setCoverLetterShort(result.short_version || '');
      setCoverLetterLong(result.long_version || '');
      setShowCoverLetter(true);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert(`Cover letter generation failed: ${error.message}`);
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
    setResumeFile(null);
    setAnalysisResult(null);
    setAppliedSuggestions(new Set());
    setOptimizedResume('');
    setPanelWidths([33.33, 33.33, 33.33]); // Reset panel widths
    setCoverLetterShort('');
    setCoverLetterLong('');
    setSelectedVersion('short');
    setShowCoverLetter(false);
    setShowRatingPopup(false);
    setSelectedRating(null);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const fileExt = file.name.toLowerCase().split('.').pop();
      if (!['pdf', 'docx'].includes(fileExt)) {
        alert('Please select a PDF or DOCX file');
        event.target.value = '';
        return;
      }
      
      setResumeFile(file);
      setResumeText(''); // Clear text when file is selected
    }
  };

  // Handle resume text change
  const handleResumeTextChange = (text) => {
    setResumeText(text);
    if (text.trim()) {
      setResumeFile(null); // Clear file when text is entered
    }
  };

  // Check if input is likely a URL
  const isLikelyURL = (text) => {
    const trimmed = text.trim();
    return trimmed.startsWith('http') && !trimmed.includes('\n') && trimmed.split(' ').length === 1;
  };

  // Check if URL might be problematic
  const isProblematicURL = (text) => {
    const trimmed = text.toLowerCase().trim();
    return trimmed.includes('linkedin.com') || trimmed.includes('indeed.com');
  };

  // Handle manual resume editing
  const handleOptimizedResumeChange = (newText) => {
    setOptimizedResume(newText);
  };

  // Add skill to resume
  const addSkillToResume = (skill) => {
    const currentResume = optimizedResume || analysisResult?.original_resume || resumeText;
    
    // Look for a skills section to add to
    const skillsRegex = /(SKILLS|Skills|TECHNICAL SKILLS|Technical Skills|CORE COMPETENCIES|Core Competencies)([\s\S]*?)(?=\n[A-Z][A-Z\s]*\n|\n\n[A-Z]|$)/i;
    const match = currentResume.match(skillsRegex);
    
    if (match) {
      // Add to existing skills section
      const skillsSection = match[0];
      const updatedSkillsSection = skillsSection + (skillsSection.endsWith('\n') ? '' : '\n') + `• ${skill}`;
      const updatedResume = currentResume.replace(skillsRegex, updatedSkillsSection);
      setOptimizedResume(updatedResume);
    } else {
      // Add a new skills section
      const updatedResume = currentResume + `\n\nSKILLS\n• ${skill}`;
      setOptimizedResume(updatedResume);
    }
  };

  // Add keyword to resume
  const addKeywordToResume = (keyword) => {
    const currentResume = optimizedResume || analysisResult?.original_resume || resumeText;
    
    // Look for a skills section first, then summary
    const skillsRegex = /(SKILLS|Skills|TECHNICAL SKILLS|Technical Skills)([\s\S]*?)(?=\n[A-Z][A-Z\s]*\n|\n\n[A-Z]|$)/i;
    const summaryRegex = /(SUMMARY|Summary|PROFILE|Profile|OBJECTIVE|Objective)([\s\S]*?)(?=\n[A-Z][A-Z\s]*\n|\n\n[A-Z]|$)/i;
    
    let updatedResume = currentResume;
    
    if (skillsRegex.test(currentResume)) {
      // Add to skills section
      const match = currentResume.match(skillsRegex);
      const skillsSection = match[0];
      const updatedSkillsSection = skillsSection + (skillsSection.endsWith('\n') ? '' : '\n') + `• ${keyword}`;
      updatedResume = currentResume.replace(skillsRegex, updatedSkillsSection);
    } else if (summaryRegex.test(currentResume)) {
      // Add to summary section
      const match = currentResume.match(summaryRegex);
      const summarySection = match[0];
      const updatedSummarySection = summarySection.replace(/\.$/, '') + `, ${keyword}.`;
      updatedResume = currentResume.replace(summaryRegex, updatedSummarySection);
    } else {
      // Add as new skills section
      updatedResume = currentResume + `\n\nSKILLS\n• ${keyword}`;
    }
    
    setOptimizedResume(updatedResume);
  };

  // Remove skill/keyword from resume
  const removeFromResume = (item) => {
    const currentResume = optimizedResume || analysisResult?.original_resume || resumeText;
    
    // Remove various patterns of the item
    const patterns = [
      new RegExp(`•\\s*${item}\\s*\n?`, 'gi'),
      new RegExp(`-\\s*${item}\\s*\n?`, 'gi'),
      new RegExp(`\\*\\s*${item}\\s*\n?`, 'gi'),
      new RegExp(`,\\s*${item}`, 'gi'),
      new RegExp(`${item}\\s*,`, 'gi'),
      new RegExp(`\\b${item}\\b`, 'gi')
    ];
    
    let updatedResume = currentResume;
    for (const pattern of patterns) {
      updatedResume = updatedResume.replace(pattern, '');
    }
    
    // Clean up any double spaces or empty lines
    updatedResume = updatedResume.replace(/\n\s*\n\s*\n/g, '\n\n').replace(/  +/g, ' ');
    
    setOptimizedResume(updatedResume);
  };

  // Check if keyword exists in resume
  const isKeywordInResume = (keyword) => {
    const resumeToCheck = optimizedResume || resumeText;
    return resumeToCheck.toLowerCase().includes(keyword.toLowerCase());
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 flex-shrink-0 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <ResumeOptimizerLogo className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ResumeAI</h1>
              <p className="text-sm text-gray-600">Optimize with intelligence</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!analysisResult ? (
          /* Landing Page */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-6xl">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                    <ResumeOptimizerLogo className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                  Perfect Your Resume with AI
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Get personalized optimization suggestions, ATS compatibility insights, 
                  and professional cover letters powered by advanced AI.
                </p>
              </div>

              {/* Main Input Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 h-96">
                    {/* Job Description Input */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Job Description
                        <span className="text-blue-600 text-xs font-normal block mt-1">
                          💡 Paste description or URL
                        </span>
                        <span className="text-orange-500 text-xs font-normal block">
                          ⚠️ LinkedIn/Indeed URLs may be blocked
                        </span>
                      </label>
                      <div className="flex-1 relative">
                        <textarea
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste job description text or URL here..."
                          className={`flex-1 w-full h-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 ${
                            isLikelyURL(jobDescription) 
                              ? isProblematicURL(jobDescription)
                                ? 'border-orange-200 bg-orange-50'
                                : 'border-blue-200 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          required
                        />
                        {isLikelyURL(jobDescription) && (
                          <div className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-lg font-medium ${
                            isProblematicURL(jobDescription) 
                              ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {isProblematicURL(jobDescription) ? '⚠️ May be blocked' : '🌐 URL detected'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resume Input */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Your Resume
                        <span className="text-green-600 text-xs font-normal block mt-1">
                          📄 Upload PDF/DOCX or paste text
                        </span>
                      </label>
                      
                      {/* File Upload Area */}
                      <div className="mb-3">
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                          id="resume-file-input"
                        />
                        <label
                          htmlFor="resume-file-input"
                          className={`block w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                            resumeFile 
                              ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {resumeFile ? (
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-green-700 font-medium">
                                  {resumeFile.name}
                                </span>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                Click to change file
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500">
                              <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div className="font-medium">Click to upload PDF or DOCX</div>
                              <div className="text-xs mt-1">Or paste text below</div>
                            </div>
                          )}
                        </label>
                      </div>

                      {/* Text Input Area */}
                      <div className="flex-1">
                        <textarea
                          value={resumeText}
                          onChange={(e) => handleResumeTextChange(e.target.value)}
                          placeholder={resumeFile ? "File selected above - or paste text here to use text instead" : "Paste your resume text here..."}
                          className={`w-full h-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200 ${
                            resumeFile ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          disabled={!!resumeFile}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="mt-8 text-center">
                    <button
                      onClick={analyzeResume}
                      disabled={isLoading || !jobDescription.trim() || (!resumeText.trim() && !resumeFile)}
                      className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 mx-auto shadow-lg ${
                        isLoading ? 'animate-pulse' : 'hover:shadow-xl hover:scale-105'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <ResumeOptimizerLogo className="w-5 h-5 text-white" />
                          <span>Analyze Resume</span>
                        </>
                      )}
                    </button>
                    
                    {/* Status indicator */}
                    <div className="mt-4 text-sm text-gray-600">
                      {isLikelyURL(jobDescription) && (
                        <div className={`${isProblematicURL(jobDescription) ? 'text-orange-600' : 'text-blue-600'} font-medium`}>
                          {isProblematicURL(jobDescription) 
                            ? '⚠️ LinkedIn/Indeed may block scraping - use text if this fails'
                            : '🌐 Will scrape job description from URL'
                          }
                        </div>
                      )}
                      {resumeFile && (
                        <div className="text-green-600 font-medium">📄 Will extract text from {resumeFile.name}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
                <div className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
                  <p className="text-gray-600">Advanced algorithms analyze your resume against job requirements</p>
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ATS Optimization</h3>
                  <p className="text-gray-600">Ensure your resume passes through applicant tracking systems</p>
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cover Letters</h3>
                  <p className="text-gray-600">Generate professional cover letters tailored to each position</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            {/* Header with actions and ratings */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <ResumeOptimizerLogo className="w-8 h-8" />
                  <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={downloadResume}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Resume</span>
                  </button>
                  <button
                    onClick={generateCoverLetter}
                    disabled={isGeneratingCoverLetter}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 text-sm disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                  >
                    {isGeneratingCoverLetter ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Generate Cover Letter</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Start Over</span>
                  </button>
                </div>
              </div>

              {/* Rating Cards */}
              <div className="grid grid-cols-3 gap-6">
                {/* Skills Gap */}
                <div 
                  onClick={() => showRatingDetails('skills')}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Skills Gap</h3>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-blue-700 mb-2">
                    {getAnalysisData()?.skillsGap?.length || 0}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    {getAnalysisData()?.skillsGap?.length === 0 ? 'No gaps found' : 'Missing skills'}
                  </p>
                </div>

                {/* ATS Keywords */}
                <div 
                  onClick={() => showRatingDetails('ats')}
                  className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 cursor-pointer hover:from-green-100 hover:to-green-200 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-green-900 uppercase tracking-wide">ATS Keywords</h3>
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-green-700 mb-2">
                    {getAnalysisData()?.atsKeywords?.length || 0}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Important keywords
                  </p>
                </div>

                {/* Overall Score */}
                <div 
                  onClick={() => showRatingDetails('score')}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 cursor-pointer hover:from-purple-100 hover:to-purple-200 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">Overall Score</h3>
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-purple-700 mb-2">
                    {getAnalysisData()?.overallScore?.match(/\d+/) ? 
                      getAnalysisData().overallScore.match(/\d+/)[0] + '/100' : 
                      'N/A'
                    }
                  </p>
                  <p className="text-sm text-purple-600 font-medium">
                    Resume match
                  </p>
                </div>
              </div>
            </div>

            {/* Resizable Panels */}
            <div 
              ref={containerRef}
              className="flex-1 flex bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
              style={{ minHeight: '500px' }}
            >
              {/* Original Resume Panel */}
              <div 
                className="flex flex-col border-r border-gray-200"
                style={{ width: `${panelWidths[0]}%` }}
              >
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Original Resume</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {analysisResult?.source_info?.resume_source === 'file' 
                      ? `📄 From ${analysisResult.source_info.file_type?.toUpperCase()} file`
                      : '📝 From text input'
                    }
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {analysisResult?.original_resume || resumeText}
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
                  <div className="text-xs text-gray-500 mt-1">
                    {analysisResult?.source_info?.job_source === 'url' 
                      ? '🌐 Job description scraped from URL'
                      : '📝 Job description from text input'
                    }
                  </div>
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
                <div className="bg-green-50 px-4 py-3 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Optimized Resume</h3>
                    <div className="text-xs text-gray-500 mt-1">
                      {appliedSuggestions.size > 0 
                        ? `✨ ${appliedSuggestions.size} suggestions applied`
                        : '💡 Apply suggestions to see changes'
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingResume(!isEditingResume)}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                      isEditingResume 
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isEditingResume ? '📖 View' : '✏️ Edit'}
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  {isEditingResume ? (
                    <textarea
                      value={optimizedResume}
                      onChange={(e) => handleOptimizedResumeChange(e.target.value)}
                      className="w-full h-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm"
                      placeholder="Your optimized resume will appear here..."
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {optimizedResume}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-100 flex-shrink-0">
        <div className="container mx-auto px-6 py-4 text-center text-gray-600 text-sm">
          <div className="flex items-center justify-center space-x-2">
            <ResumeOptimizerLogo className="w-4 h-4" />
            <p>Free AI-powered resume optimization • Made with ❤️ for job seekers</p>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            {/* Modal Header */}
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-6">
                <ResumeOptimizerLogo className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Resume</h3>
              <p className="text-gray-600">Our AI is optimizing your resume for maximum impact</p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4 mb-8">
              {progressSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    step.status === 'completed' 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : step.status === 'active'
                      ? 'bg-blue-500 text-white shadow-lg animate-pulse'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.status === 'completed' ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : step.status === 'active' ? (
                      <svg className="animate-spin w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM10 1a9 9 0 110 18 9 9 0 010-18z" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className={`ml-4 font-medium transition-all duration-300 ${
                    step.status === 'completed' || step.status === 'active'
                      ? 'text-gray-900' 
                      : 'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  {step.status === 'active' && (
                    <div className="ml-auto">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${(currentStep + 1) / progressSteps.length * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2 font-medium">
                <span>Progress</span>
                <span>{Math.round((currentStep + 1) / progressSteps.length * 100)}%</span>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-xl border border-blue-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Estimated time: 10-30 seconds</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Details Modal */}
      {showRatingPopup && selectedRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{selectedRating.title}</h2>
              <button
                onClick={() => setShowRatingPopup(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 text-sm"
              >
                Close
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-auto">
              <p className="text-gray-700 mb-4">{selectedRating.description}</p>
              
              {selectedRating.type === 'skills' && selectedRating.items.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Missing Skills:</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedRating.items.map((skill, index) => {
                      const exists = isKeywordInResume(skill);
                      return (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                          exists 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <span className={`font-medium ${
                            exists ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {exists ? '✓' : '•'} {skill}
                          </span>
                          {!exists ? (
                            <button
                              onClick={() => addSkillToResume(skill)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200 flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                              <span>Add</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => removeFromResume(skill)}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200 flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {selectedRating.type === 'keywords' && selectedRating.items.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">ATS Keywords:</h3>
                  
                  {/* Legend */}
                  <div className="flex items-center space-x-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
                      <span className="text-gray-600">Already in your resume</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded"></div>
                      <span className="text-gray-600">Missing - can be added</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {selectedRating.items.map((keyword, index) => {
                      const exists = isKeywordInResume(keyword);
                      return (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                          exists 
                            ? 'bg-green-50 border-green-300' 
                            : 'bg-orange-50 border-orange-400'
                        }`}>
                          <span className={`font-medium ${
                            exists ? 'text-green-800' : 'text-orange-900'
                          }`}>
                            {exists ? '✓' : '+'} {keyword}
                          </span>
                          {!exists ? (
                            <button
                              onClick={() => addKeywordToResume(keyword)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                              <span>Add</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => removeFromResume(keyword)}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200 flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">
                        {selectedRating.items.filter(k => isKeywordInResume(k)).length} of {selectedRating.items.length}
                      </span> keywords found in your resume. 
                      <span className="font-semibold text-blue-700 ml-1">
                        Click "Add" to include missing keywords directly in your resume!
                      </span>
                    </p>
                  </div>
                </div>
              )}
              
              {selectedRating.type === 'skills' && selectedRating.items.length === 0 && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">✓ Excellent! Your resume covers all the key skills mentioned in the job description.</p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Recommendation:</h3>
                <p className="text-blue-800">{selectedRating.recommendation}</p>
                
                {selectedRating.type === 'keywords' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Pro Tip:</strong> Add missing keywords naturally in your skills section, 
                      job descriptions, or achievements. Avoid keyword stuffing - use them in meaningful context.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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