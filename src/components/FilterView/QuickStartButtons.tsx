import React from 'react';
import { FaRocket } from 'react-icons/fa';

export function QuickStartButtons({ onQuickStart }: { onQuickStart: (params: { difficulty?: string, count: number }) => void }) {
  return (
    <div className="quick-start-container">
      <legend><FaRocket /> Quick Start</legend>
      <div className="quick-start-buttons">
        <button onClick={() => onQuickStart({ difficulty: 'Easy', count: 25 })}>Quick 25 Easy</button>
        <button onClick={() => onQuickStart({ difficulty: 'Medium', count: 25 })}>Quick 25 Moderate</button>
        <button onClick={() => onQuickStart({ difficulty: 'Hard', count: 25 })}>Quick 25 Hard</button>
        <button onClick={() => onQuickStart({ count: 25 })}>Quick 25 Mix Level</button>
      </div>
    </div>
  );
}
