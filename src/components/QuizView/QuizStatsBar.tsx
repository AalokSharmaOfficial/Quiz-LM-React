import React from 'react';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';

export function QuizStatsBar({ correct, wrong, remaining }: { correct: number, wrong: number, remaining: number }) {
  return (
    <div className="quiz-stats-bar">
      <span><FiCheck /> Correct: {correct}</span>
      <span><FiX /> Wrong/Timeout: {wrong}</span>
      <span><FiClock /> Remaining: {remaining}</span>
    </div>
  );
}
