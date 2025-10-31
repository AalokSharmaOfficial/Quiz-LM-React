import React from 'react';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { Question } from '../../types';

export function QuestionInfo({ question, currentIndex, total, isBookmarked, onToggleBookmark }: { question: Question, currentIndex: number, total: number, isBookmarked: boolean, onToggleBookmark: () => void }) {
  return (
    <div className="question-info">
      <div className="question-info-group">
        <span>Q.{currentIndex + 1} / {total}</span>
        <button className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`} onClick={onToggleBookmark} aria-label="Bookmark question">
          {isBookmarked ? <FaStar /> : <FaRegStar />}
        </button>
        <span>ID: {question.id}</span>
      </div>
      <div className="question-info-group source-details">
        <span className="source-exam">{question.sourceInfo.examName} ({question.sourceInfo.examYear})</span>
        <span className="source-shift">{question.sourceInfo.examDateShift}</span>
      </div>
    </div>
  );
}
