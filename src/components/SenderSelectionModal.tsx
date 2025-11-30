// src/components/SenderSelectionModal.tsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface SenderSelectionModalProps {
  senders: string[];
  onSelect: (sender: string) => void;
  onClose: () => void;
}

export default function SenderSelectionModal({ 
  senders, 
  onSelect, 
  onClose 
}: SenderSelectionModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Who are you in this conversation?</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          We detected a WhatsApp conversation between multiple people. Please select which person you are so we can analyze the other person&apos;s behavior correctly.
        </p>
        
        <div className="space-y-2">
          {senders.map((sender, index) => (
            <button
              key={`${sender}-${index}`}
              onClick={() => onSelect(sender)}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-blue-700">
                    {sender}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click if this is you
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-blue-500">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800">
            <strong>Why we ask:</strong> We need to know who you are to properly analyze the other person&apos;s behavior and identify any concerning patterns.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}