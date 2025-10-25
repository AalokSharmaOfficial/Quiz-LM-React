import React from 'react';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { Question } from '../../types';

export function QuestionInfo({ question, currentIndex, total, isBookmarked, onToggleBookmark }: { question: Question, currentIndex: number, total: number, isBookmarked: boolean, onToggleBookmark: () => void }) {
  return (
    <div className="question-info">
      <span>Q.{currentIndex + 1} / {total}</span>
      <button className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`} onClick={onToggleBookmark} aria-label="Bookmark question">
        {isBookmarked ? <FaStar /> : <FaRegStar />}
      </button>
      <span>Actual ID: {question.id}</span>
    </div>
  );
}
