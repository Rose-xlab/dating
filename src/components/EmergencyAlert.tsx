// src/components/EmergencyAlert.tsx
export default function EmergencyAlert({ analysisResult }: { analysisResult: AnalysisResult }) {
  if (analysisResult.riskScore < 90) return null;
  
  return (
    <div className="bg-red-100 border-2 border-red-600 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-3">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-red-900 mb-2">
            ⚠️ IMMEDIATE SAFETY CONCERN
          </h3>
          <p className="text-red-800 mb-4">
            This conversation shows dangerous patterns including stalking, harassment, and controlling behavior.
          </p>
          
          <div className="bg-white rounded p-4 space-y-3">
            <div>
              <h4 className="font-bold text-red-900">Immediate Actions:</h4>
              <ul className="list-disc list-inside text-sm text-red-800">
                <li>Block this person on all platforms</li>
                <li>Document all unwanted contact</li>
                <li>Tell trusted friends/family</li>
                <li>Consider contacting authorities</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-red-900">Resources:</h4>
              <ul className="text-sm text-red-800">
                <li>National DV Hotline: 1-800-799-7233</li>
                <li>Crisis Text: Text HOME to 741741</li>
                <li>Local police non-emergency line</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}