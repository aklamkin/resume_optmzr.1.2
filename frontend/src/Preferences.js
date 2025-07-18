import React, { useState, useEffect } from 'react';
import './Preferences.css';

const Preferences = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('aiServices');
  const [apiKeys, setApiKeys] = useState({});
  const [customPrompt, setCustomPrompt] = useState('');
  const [savePath, setSavePath] = useState('');

  useEffect(() => {
    const savedApiKeys = localStorage.getItem('apiKeys');
    if (savedApiKeys) {
      setApiKeys(JSON.parse(savedApiKeys));
    }

    const savedCustomPrompt = localStorage.getItem('customPrompt');
    if (savedCustomPrompt) {
      setCustomPrompt(savedCustomPrompt);
    }

    const savedSavePath = localStorage.getItem('savePath');
    if (savedSavePath) {
      setSavePath(savedSavePath);
    }
  }, []);

  const handleApiKeyChange = (service, key) => {
    const newApiKeys = { ...apiKeys, [service]: key };
    setApiKeys(newApiKeys);
    localStorage.setItem('apiKeys', JSON.stringify(newApiKeys));
  };

  const handleCustomPromptChange = (e) => {
    setCustomPrompt(e.target.value);
    localStorage.setItem('customPrompt', e.target.value);
  };

  const handleSavePathChange = (e) => {
    setSavePath(e.target.value);
    localStorage.setItem('savePath', e.target.value);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="preferences-modal">
      <div className="preferences-content">
        <div className="preferences-header">
          <h2>Preferences</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="preferences-body">
          <div className="tabs">
            <button
              className={activeTab === 'aiServices' ? 'active' : ''}
              onClick={() => setActiveTab('aiServices')}
            >
              AI Services
            </button>
            <button
              className={activeTab === 'prompts' ? 'active' : ''}
              onClick={() => setActiveTab('prompts')}
            >
              Custom Prompts
            </button>
            <button
              className={activeTab === 'saving' ? 'active' : ''}
              onClick={() => setActiveTab('saving')}
            >
              Saving
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'aiServices' && (
              <div className="ai-services">
                <h3>Configure AI Services</h3>
                <div className="service">
                  <label>OpenAI API Key:</label>
                  <input
                    type="password"
                    value={apiKeys.openai || ''}
                    onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                  />
                </div>
                <div className="service">
                  <label>Perplexity API Key:</label>
                  <input
                    type="password"
                    value={apiKeys.perplexity || ''}
                    onChange={(e) => handleApiKeyChange('perplexity', e.target.value)}
                  />
                </div>
                <div className="service">
                  <label>Grok API Key:</label>
                  <input
                    type="password"
                    value={apiKeys.grok || ''}
                    onChange={(e) => handleApiKeyChange('grok', e.target.value)}
                  />
                </div>
                <div className="service">
                  <label>DeepSeek API Key:</label>
                  <input
                    type="password"
                    value={apiKeys.deepseek || ''}
                    onChange={(e) => handleApiKeyChange('deepseek', e.target.value)}
                  />
                </div>
                <div className="service">
                  <label>Claude API Key:</label>
                  <input
                    type="password"
                    value={apiKeys.claude || ''}
                    onChange={(e) => handleApiKeyChange('claude', e.target.value)}
                  />
                </div>
              </div>
            )}
            {activeTab === 'prompts' && (
              <div className="custom-prompts">
                <h3>Customize Prompts</h3>
                <textarea
                  value={customPrompt}
                  onChange={handleCustomPromptChange}
                  placeholder="Enter your custom prompt here..."
                />
              </div>
            )}
            {activeTab === 'saving' && (
              <div className="saving-preferences">
                <h3>Saving Preferences</h3>
                <label>Save Path:</label>
                <input
                  type="text"
                  value={savePath}
                  onChange={handleSavePathChange}
                  placeholder="/path/to/save/results"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
