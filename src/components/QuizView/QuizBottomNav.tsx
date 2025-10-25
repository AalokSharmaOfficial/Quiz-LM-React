import React from 'react';
import { FiFlag } from 'react-icons/fi';

export function QuizBottomNav({ onPrevious, onNext, onToggleMarkForReview, isMarked, isFirst, isLast, isAnswered }: {
    onPrevious: () => void;
    onNext: () => void;
    onToggleMarkForReview: () => void;
    isMarked: boolean;
    isFirst: boolean;
    isLast: boolean;
    isAnswered: boolean;
}) {
    return (
        <div className="quiz-bottom-nav">
            <button className="prev-btn" onClick={onPrevious} disabled={isFirst}>← Previous</button>
            <button className={`mark-review-btn ${isMarked ? 'active' : ''}`} onClick={onToggleMarkForReview}>
              <FiFlag /> {isMarked ? 'Unmark' : 'Mark for Review'}
            </button>
            <button className="next-btn" onClick={onNext} disabled={!isAnswered}>
                {isLast ? 'Finish' : 'Next'} →
            </button>
        </div>
    );
}
