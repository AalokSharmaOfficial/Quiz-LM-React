import React from 'react';

export function DonutChart({ correct, incorrect, unanswered, attempted }: { correct: number, incorrect: number, unanswered: number, attempted: number }) {
  const total = correct + incorrect + unanswered;
  if (total === 0) return null;

  const accuracyPct = attempted > 0 ? (correct / attempted) : 0;
  const correctPct = (correct / total);
  const incorrectPct = (incorrect / total);
  
  const circumference = 2 * Math.PI * 45;
  const correctStroke = correctPct * circumference;
  const incorrectStroke = incorrectPct * circumference;

  const correctOffset = 0;
  const incorrectOffset = correctStroke;
  
  return (
    <div className="donut-chart-container">
      <svg viewBox="0 0 100 100">
        <circle className="donut-bg" cx="50" cy="50" r="45" />
        <circle 
          className="donut-segment correct" 
          cx="50" cy="50" r="45"
          strokeDasharray={`${correctStroke} ${circumference}`}
          strokeDashoffset={-correctOffset}
        />
        <circle 
          className="donut-segment incorrect" 
          cx="50" cy="50" r="45"
          strokeDasharray={`${incorrectStroke} ${circumference}`}
          strokeDashoffset={-incorrectOffset}
        />
      </svg>
      <div className="chart-text">
        <span className="score-percentage">{Math.round(accuracyPct * 100)}%</span>
        <span className="score-label">Accuracy</span>
      </div>
    </div>
  );
}
