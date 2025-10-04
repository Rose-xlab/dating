import React from 'react';
import { TimelineEvent, ChatMessage, EmotionalTone } from '@/types';
import { format } from 'date-fns';

interface TimelineProps {
  events: TimelineEvent[];
  messages: ChatMessage[];
}

export default function Timeline({ events, messages }: TimelineProps) {
  const getToneColor = (tone: EmotionalTone): string => {
    const colors: Record<EmotionalTone, string> = {
      neutral: 'bg-gray-400',
      playful: 'bg-blue-400',
      intimate: 'bg-pink-400',
      urgent: 'bg-orange-400',
      pressuring: 'bg-red-400',
      supportive: 'bg-green-400',
      defensive: 'bg-yellow-400',
    };
    return colors[tone] || 'bg-gray-400';
  };

  const getToneLabel = (tone: EmotionalTone): string => {
    return tone.charAt(0).toUpperCase() + tone.slice(1);
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'emotional_shift':
        return '🔄';
      case 'request':
        return '❓';
      case 'escalation':
        return '⚡';
      default:
        return '•';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversation Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex items-start">
              {/* Event dot */}
              <div className="absolute left-6 w-4 h-4 bg-white border-2 border-gray-400 rounded-full z-10"></div>
              
              {/* Event icon */}
              <div className="w-12 text-2xl text-center">{getEventIcon(event.type)}</div>
              
              {/* Event content */}
              <div className="flex-1 ml-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {event.type === 'emotional_shift' && 'Emotional Shift'}
                      {event.type === 'request' && 'Request Made'}
                      {event.type === 'escalation' && 'Escalation Detected'}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {format(event.timestamp, 'h:mm a')}
                    </span>
                  </div>
                  
                  {event.type === 'emotional_shift' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${getToneColor(event.from)}`}>
                        {getToneLabel(event.from)}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className={`px-2 py-1 rounded text-xs text-white ${getToneColor(event.to)}`}>
                        {getToneLabel(event.to)}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-700">{event.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emotional Progression Chart */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Emotional Progression</h4>
        <div className="relative h-32 bg-gray-50 rounded-lg p-4">
          <div className="absolute inset-0 grid grid-cols-7 gap-px p-4">
            {['neutral', 'playful', 'intimate', 'urgent', 'pressuring', 'supportive', 'defensive'].map((tone, index) => (
              <div key={tone} className="flex flex-col items-center justify-end">
                <div 
                  className={`w-full ${getToneColor(tone as EmotionalTone)} rounded-t`}
                  style={{
                    height: `${(events.filter(e => 
                      e.type === 'emotional_shift' && 
                      (e.from === tone || e.to === tone)
                    ).length / Math.max(events.length, 1)) * 100}%`
                  }}
                />
                <span className="text-xs text-gray-600 mt-2 -rotate-45 origin-top-left">
                  {tone.slice(0, 4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}