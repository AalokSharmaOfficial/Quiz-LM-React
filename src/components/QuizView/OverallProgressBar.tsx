import React from 'react';

export function OverallProgressBar({ current, total }: { current: number, total: number }) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div className="overall-progress-bar-container">
      <div className="overall-progress-bar" style={{ width: `${progress}%` }}></div>
    </div>
  );
}
