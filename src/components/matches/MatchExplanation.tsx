import React from 'react';
import { MatchPoint } from '@/hooks/useMatchPoints';

type MatchExplanationProps = {
  matchPoints: MatchPoint[];
};

const MatchExplanation: React.FC<MatchExplanationProps> = ({ matchPoints = [] }) => {
  // If no points are available, show loading state
  if (!matchPoints || matchPoints.length === 0) {
    return (
      <div className="rounded-lg bg-white/8 backdrop-blur-md p-6">
        <p className="text-white/70 italic">Match explanation is being generated...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {matchPoints.map((point: MatchPoint, index: number) => (
        <div key={index} className="mb-5">
          <h3 className="text-[#73FFF6] font-medium mb-2">{point.header}</h3>
          <p className="text-white/90 text-sm">{point.explanation}</p>
        </div>
      ))}
    </div>
  );
};

export default MatchExplanation;