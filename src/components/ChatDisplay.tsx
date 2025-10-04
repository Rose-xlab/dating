import React, { useState } from 'react';
import { ChatMessage, Flag, Evidence } from '@/types';
import { format } from 'date-fns';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface ChatDisplayProps {
  messages: ChatMessage[];
  flags: Flag[];
  evidence: Evidence[];
}

export default function ChatDisplay({ messages, flags, evidence }: ChatDisplayProps) {
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);

  const getEvidenceForMessage = (messageId: string) => {
    return evidence.filter(e => e.messageId === messageId);
  };

  const getFlagsForMessage = (messageId: string) => {
    return flags.filter(f => f.messageId === messageId);
  };

  const highlightEvidence = (content: string, evidenceList: Evidence[]) => {
    if (evidenceList.length === 0) return content;

    // Sort evidence by start index in descending order to avoid index shifting
    const sortedEvidence = [...evidenceList].sort((a, b) => b.startIndex - a.startIndex);
    
    let result = content;
    sortedEvidence.forEach((ev) => {
      const flag = flags.find(f => f.id === ev.flagId);
      if (flag) {
        const className = flag.type === 'red' 
          ? 'bg-red-200 border-b-2 border-red-500 px-1 rounded cursor-pointer hover:bg-red-300' 
          : 'bg-green-200 border-b-2 border-green-500 px-1 rounded cursor-pointer hover:bg-green-300';
        
        result = 
          result.slice(0, ev.startIndex) +
          `<span class="${className}" data-flag-id="${flag.id}">${ev.text}</span>` +
          result.slice(ev.endIndex);
      }
    });
    
    return result;
  };

  return (
    <div className="flex gap-6">
      {/* Chat Messages */}
      <div className="flex-1">
        <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => {
              const messageFlags = getFlagsForMessage(message.id);
              const messageEvidence = getEvidenceForMessage(message.id);
              const hasRedFlags = messageFlags.some(f => f.type === 'red');
              const hasGreenFlags = messageFlags.some(f => f.type === 'green');

              return (
                <div
                  key={message.id}
                  className={`relative ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                >
                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 mb-1">
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                  
                  {/* Message bubble */}
                  <div
                    className={`inline-block max-w-[70%] ${
                      message.sender === 'user'
                        ? 'chat-message user'
                        : 'chat-message match'
                    } ${hasRedFlags ? 'ring-2 ring-red-400' : ''} ${hasGreenFlags && !hasRedFlags ? 'ring-2 ring-green-400' : ''}`}
                  >
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: highlightEvidence(message.content, messageEvidence) 
                      }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.dataset.flagId) {
                          setSelectedFlag(target.dataset.flagId);
                        }
                      }}
                    />
                  </div>

                  {/* Flag indicators */}
                  {messageFlags.length > 0 && (
                    <div className={`mt-1 flex gap-1 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {messageFlags.map((flag) => (
                        <button
                          key={flag.id}
                          onClick={() => setSelectedFlag(flag.id)}
                          className={`p-1 rounded-full ${
                            flag.type === 'red' 
                              ? 'bg-red-100 hover:bg-red-200' 
                              : 'bg-green-100 hover:bg-green-200'
                          }`}
                        >
                          {flag.type === 'red' ? (
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flag Details Panel */}
      <div className="w-80">
        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-0">
          <h4 className="font-medium text-gray-900 mb-4">Analysis Details</h4>
          
          {selectedFlag ? (
            <>
              {(() => {
                const flag = flags.find(f => f.id === selectedFlag);
                if (!flag) return null;
                
                return (
                  <div className={`rounded-lg p-4 ${
                    flag.type === 'red' ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    <div className="flex items-start space-x-3 mb-3">
                      {flag.type === 'red' ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                      <h5 className={`font-medium ${
                        flag.type === 'red' ? 'text-red-900' : 'text-green-900'
                      }`}>
                        {flag.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                    </div>
                    
                    <p className={`text-sm mb-3 ${
                      flag.type === 'red' ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {flag.message}
                    </p>
                    
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Evidence:</p>
                      <p className={`text-sm italic ${
                        flag.type === 'red' ? 'text-red-700' : 'text-green-700'
                      }`}>
                        "{flag.evidence}"
                      </p>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        flag.severity === 'high' 
                          ? flag.type === 'red' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                          : flag.severity === 'medium'
                          ? flag.type === 'red' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          : flag.type === 'red' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {flag.severity} severity
                      </span>
                      <button
                        onClick={() => setSelectedFlag(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Click on highlighted text or flag icons to see details</p>
            </div>
          )}
          
          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Summary</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Messages</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">Red Flags</span>
                <span className="font-medium text-red-600">
                  {flags.filter(f => f.type === 'red').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">Green Flags</span>
                <span className="font-medium text-green-600">
                  {flags.filter(f => f.type === 'green').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}