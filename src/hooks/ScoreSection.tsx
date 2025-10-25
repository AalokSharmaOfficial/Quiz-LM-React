import React from 'react';
import { DonutChart } from './DonutChart';

export function ScoreSection({ 
  correct, incorrect, unanswered, onPlayAgain, onReviewAnswers, onShare
}: { 
  correct: number; incorrect: number; unanswered: number; 
  onPlayAgain: () => void; onReviewAnswers: () => void; onShare: () => void;
}) {
  const total = correct + incorrect + unanswered;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  let message = '';
  if (score > 80) message = "Excellent work!";
  else if (score > 50) message = "Not bad, keep practicing!";
  else message = "Good effort, keep trying!";

  return (
    <div id="score-section-capture" className="score-section">
      <h2>Quiz Complete!</h2>
      <p className="score-message">{message}</p>
      <DonutChart correct={correct} incorrect={incorrect} unanswered={unanswered} />
      <div className="score-summary">
        <p>Correct: <span>{correct}</span></p>
        <p>Incorrect: <span>{incorrect}</span></p>
        <p>Unanswered: <span>{unanswered}</span></p>
      </div>
      <div className="score-actions">
        <button className="share-results-btn" onClick={onShare}>
          Share Results
        </button>
        <button className="review-answers-btn" onClick={onReviewAnswers}>
          Review Answers
        </button>
        <button className="play-again-btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
