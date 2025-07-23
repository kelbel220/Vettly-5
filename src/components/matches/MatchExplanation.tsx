import React from 'react';

interface MatchPoint {
  header: string;
  explanation: string;
}

interface MatchExplanationProps {
  matchPoints: MatchPoint[];
}

const MatchExplanation: React.FC<MatchExplanationProps> = ({ matchPoints = [] }) => {
  if (!matchPoints || matchPoints.length === 0) {
    return (
      <div className="rounded-lg bg-white/8 backdrop-blur-md p-6">
        <p className="text-white/70 italic">Match explanation is being generated...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matchPoints.map((point, index) => (
        <div key={index} className="bg-white/8 backdrop-blur-md rounded-lg p-4">
          <h3 className="text-[#73FFF6] font-medium mb-1">{point.header}</h3>
          <p className="text-white/80 text-sm">{point.explanation}</p>
        </div>
      ))}
    </div>
  );
};

export default MatchExplanation;