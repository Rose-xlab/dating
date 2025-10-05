import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface SenderConfigModalProps {
  userPosition: 'left' | 'right';
  onPositionChange: (position: 'left' | 'right') => void;
  onClose: () => void;
}

export default function SenderConfigModal({ 
  userPosition, 
  onPositionChange, 
  onClose 
}: SenderConfigModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Message Position Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Where do YOUR messages appear in the conversation?
              </h3>
              {/* UPDATED: Text clarified for better user understanding */}
              <p className="text-sm text-gray-500 mb-4">
                This is crucial for accurately parsing <strong>pasted text conversations.</strong> For screenshots, our AI will attempt to detect this automatically.
              </p>
            </div>

            {/* Visual Examples */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Side Option */}
              <button
                onClick={() => onPositionChange('left')}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  userPosition === 'left'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-900 mb-2">Left Side</div>
                  <div className="text-xs text-gray-500">Less common</div>
                </div>
                
                {/* Visual Example */}
                <div className="space-y-2">
                  <div className="flex justify-start">
                    <div className="bg-blue-500 text-white rounded-lg px-3 py-1 text-xs">
                      Your message
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gray-300 text-gray-700 rounded-lg px-3 py-1 text-xs">
                      Their message
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-blue-500 text-white rounded-lg px-3 py-1 text-xs">
                      Your reply
                    </div>
                  </div>
                </div>

                {userPosition === 'left' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>

              {/* Right Side Option */}
              <button
                onClick={() => onPositionChange('right')}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  userPosition === 'right'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-900 mb-2">Right Side</div>
                  <div className="text-xs text-gray-500">Most common</div>
                </div>
                
                {/* Visual Example */}
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-lg px-3 py-1 text-xs">
                      Your message
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-300 text-gray-700 rounded-lg px-3 py-1 text-xs">
                      Their message
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-lg px-3 py-1 text-xs">
                      Your reply
                    </div>
                  </div>
                </div>

                {userPosition === 'right' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Platform-specific notes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Platform Guide:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><strong>Tinder, Bumble, Hinge:</strong> Your messages usually appear on the right</li>
                <li><strong>WhatsApp, iMessage:</strong> Your messages appear on the right</li>
                <li><strong>Facebook Messenger:</strong> Your messages appear on the right</li>
                <li><strong>Some Android apps:</strong> May vary, check your chat layout</li>
              </ul>
            </div>

            {/* UPDATED: Tip text rephrased for clarity */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> For screenshots, our AI is trained to identify the user and match automatically. This setting ensures maximum accuracy, especially for pasted text.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}