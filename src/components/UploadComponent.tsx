//src\components\UploadComponent.tsx

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentTextIcon, PhotoIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UploadComponentProps {
  onTextSubmit: (text: string) => void;
  onImageSubmit: (file: File) => void;
  isProcessing: boolean;
  userPosition?: 'left' | 'right';
}

export default function UploadComponent({ 
  onTextSubmit, 
  onImageSubmit, 
  isProcessing,
  userPosition = 'right'
}: UploadComponentProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Submit for processing
      onImageSubmit(file);
    }
  }, [onImageSubmit]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }
    
    // Check if the text has enough content for analysis
    const messageCount = textInput.split('\n').filter(line => line.trim().length > 0).length;
    if (messageCount < 2) {
      toast.warning('Please include at least 2 messages for meaningful analysis');
      return;
    }
    
    onTextSubmit(textInput);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    setTextInput(text);
    
    // Check if there's an image in clipboard
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          setActiveTab('image');
          onDrop([blob]);
        }
        return;
      }
    }
    
    // Show helper message
    toast.success('Text pasted! We\'ll identify who\'s who automatically.');
  };

  const sampleConversation = `Match: Hey! How's your weekend going?
Me: Pretty good! Just relaxing at home. How about you?
Match: Nice! I went hiking this morning. Do you like outdoor activities?
Me: I love hiking! Where did you go?
Match: There's this great trail near the mountains. We should go together sometime!
Me: That sounds fun, but maybe we should video chat first?
Match: Oh come on, don't you trust me? Let's just meet up!`;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'text'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <DocumentTextIcon className="w-5 h-5 inline-block mr-2" />
          Paste Text
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'image'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <PhotoIcon className="w-5 h-5 inline-block mr-2" />
          Upload Screenshot
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {activeTab === 'text' ? (
          <div className="space-y-4">
            {/* Format Guide Toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="chat-text" className="block text-sm font-medium text-gray-700">
                Paste your chat conversation
              </label>
              <button
                onClick={() => setShowFormatGuide(!showFormatGuide)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <InformationCircleIcon className="w-4 h-4" />
                <span>{showFormatGuide ? 'Hide' : 'Show'} format guide</span>
              </button>
            </div>

            {/* Format Guide */}
            {showFormatGuide && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-blue-900">Text Format Tips:</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>Option 1:</strong> Include sender names</p>
                  <pre className="bg-white rounded p-2 text-xs overflow-x-auto">
{`Sarah: Hey, how are you?
Me: I'm good! How about you?
Sarah: Great! Want to meet up?`}
                  </pre>
                  
                  <p><strong>Option 2:</strong> Use indentation (your messages indented)</p>
                  <pre className="bg-white rounded p-2 text-xs overflow-x-auto">
{`Hey, how are you?
    I'm good! How about you?
Great! Want to meet up?`}
                  </pre>
                  
                  <p className="text-xs italic">
                    Don't worry if the format isn't perfect - our AI will figure it out!
                  </p>
                </div>
              </div>
            )}

            {/* Text Input */}
            <div className="relative">
              <textarea
                id="chat-text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onPaste={handlePaste}
                placeholder={`Paste your conversation here...\n\nExample:\n${sampleConversation}`}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none font-mono text-sm"
                disabled={isProcessing}
              />
              
              {/* Character/Line Counter */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {textInput.split('\n').filter(line => line.trim()).length} lines
              </div>
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <p>Copy the entire conversation including timestamps if available</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <p>We'll automatically detect who's who based on message patterns</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <p>Personal information will be automatically redacted</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <p>Your messages ({userPosition} side) will be analyzed against theirs</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleTextSubmit}
              disabled={isProcessing || !textInput.trim()}
              className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Conversation...
                </>
              ) : (
                'Analyze Conversation'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="mx-auto max-h-64 rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-600">
                    {isProcessing ? 'Processing screenshot...' : 'Drop another image to replace'}
                  </p>
                </div>
              ) : (
                <>
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop the screenshot here...'
                      : 'Drag and drop a chat screenshot, or click to select'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, JPEG up to 10MB
                  </p>
                </>
              )}
            </div>

            {/* Screenshot Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">📸 Screenshot Tips for Best Results:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Include the full width of the conversation</li>
                <li>• Capture multiple messages from both sides</li>
                <li>• Ensure text is clear and readable</li>
                <li>• Include message bubbles/alignment if possible</li>
                <li>• We'll detect that your messages are on the {userPosition} side</li>
              </ul>
            </div>

            {/* Platform Detection Note */}
            <div className="text-sm text-gray-600 text-center">
              <p>🔍 We automatically detect the dating platform and message positioning</p>
              <p className="text-xs mt-1">Supports: Tinder, Bumble, Hinge, and more</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}