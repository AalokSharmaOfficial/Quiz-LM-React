import React from 'react';

export function DonutChart({ correct, incorrect, unanswered }: { correct: number, incorrect: number, unanswered: number }) {
  const total = correct + incorrect + unanswered;
  if (total === 0) return null;

  const correctPct = (correct / total);
  const incorrectPct = (incorrect / total);
  
  const circumference = 2 * Math.PI * 45;
  const correctStroke = correctPct * circumference;
  const incorrectStroke = incorrectPct * circumference;

  const correctOffset = 0;
  const incorrectOffset = correctStroke;
  
  return (
    <div className="donut-chart-container">
      <svg width="200" height="200" viewBox="0 0 100 100">
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
        <span className="score-percentage">{Math.round(correctPct * 100)}%</span>
        <span className="score-label">Correct</span>
      </div>
    </div>
  );
}
