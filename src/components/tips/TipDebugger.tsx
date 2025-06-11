'use client';

import React from 'react';
import { WeeklyTip } from '@/lib/models/weeklyTip';

interface TipDebuggerProps {
  tip: WeeklyTip;
}

export const TipDebugger: React.FC<TipDebuggerProps> = ({ tip }) => {
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-0 right-0 bg-black/80 text-white p-4 max-w-md max-h-96 overflow-auto z-50 text-xs font-mono">
      <h3 className="font-bold mb-2">Tip Data Debugger</h3>
      <div>
        <p><strong>ID:</strong> {tip.id}</p>
        <p><strong>Title:</strong> {tip.title}</p>
        <p><strong>Category:</strong> {tip.category}</p>
        <p><strong>Status:</strong> {tip.status}</p>
        <p><strong>whyMatters present:</strong> {tip.whyMatters ? 'Yes' : 'No'}</p>
        {tip.whyMatters && (
          <div>
            <p><strong>whyMatters content:</strong></p>
            <p className="bg-gray-800 p-2 mt-1 rounded">{tip.whyMatters}</p>
          </div>
        )}
        <button 
          onClick={() => console.log('Full tip data:', tip)} 
          className="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs"
        >
          Log Full Tip Data
        </button>
      </div>
    </div>
  );
};
