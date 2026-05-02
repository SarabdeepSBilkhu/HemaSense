import React from 'react';
import { Sparkles } from 'lucide-react';

export default function HealthSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-8 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Sparkles size={20} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">AI Health Insights</h2>
        </div>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
            {summary}
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-blue-200/50">
          <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
            Disclaimer: AI-generated insights should not replace professional medical advice. Always consult a healthcare provider for a proper diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
