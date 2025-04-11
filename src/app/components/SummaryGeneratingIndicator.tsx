import React from 'react';
import { inter } from '@/app/fonts';

interface SummaryGeneratingIndicatorProps {
  visible: boolean;
}

const SummaryGeneratingIndicator: React.FC<SummaryGeneratingIndicatorProps> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <div className="mt-6 p-4 backdrop-blur-md bg-white/15 rounded-xl border border-white/30 flex items-center">
      <div className="w-6 h-6 border-2 border-[#73FFF6] border-t-transparent rounded-full animate-spin mr-3"></div>
      <p className={`${inter.className} text-white text-sm`}>
        Generating your personalized summary with AI...
      </p>
    </div>
  );
};

export default SummaryGeneratingIndicator;
