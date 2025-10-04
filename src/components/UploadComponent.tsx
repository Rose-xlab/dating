import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UploadComponentProps {
  onTextSubmit: (text: string) => void;
  onImageSubmit: (file: File) => void;
  isProcessing: boolean;
}

export default function UploadComponent({ onTextSubmit, onImageSubmit, isProcessing }: UploadComponentProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

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
  };

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
            <div>
              <label htmlFor="chat-text" className="block text-sm font-medium text-gray-700 mb-2">
                Paste your chat conversation
              </label>
              <textarea
                id="chat-text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste your conversation here... You can copy directly from any dating app or messenger."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                disabled={isProcessing}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>💡 Tip: Copy the entire conversation including timestamps if available</p>
            </div>
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
                  Analyzing...
                </>
              ) : (
                'Analyze Conversation'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
                    {isProcessing ? 'Processing image...' : 'Drop another image to replace'}
                  </p>
                </div>
              ) : (
                <>
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop the image here...'
                      : 'Drag and drop a screenshot, or click to select'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, JPEG up to 10MB
                  </p>
                </>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <p>🔒 Your images are processed securely and never stored</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}