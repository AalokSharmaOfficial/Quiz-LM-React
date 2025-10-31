import React, { useState, useMemo, useEffect } from 'react';
import { Question } from '../../types';
import { SegmentedControl } from '../common/SegmentedControl';
import { QuestionComponent } from '../QuizView/QuestionComponent';
import { ExplanationComponent } from '../QuizView/ExplanationComponent';

export function ReviewSection({
  questions, userAnswers, onBackToScore, bookmarkedQuestions, onGoHome, initialFilter
}: {
  questions: Question[], userAnswers: {[key: string]: string},
  onBackToScore: () => void, bookmarkedQuestions: string[],
  onGoHome: () => void,
  initialFilter?: 'all' | 'correct' | 'incorrect' | 'bookmarked'
}) {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'bookmarked'>(initialFilter || 'all');
  const [reviewIndex, setReviewIndex] = useState(0);

  const reviewCounts = useMemo(() => {
    const counts = {
      all: questions.length,
      correct: 0,
      incorrect: 0,
      bookmarked: bookmarkedQuestions.length,
    };
    questions.forEach(q => {
      const answer = userAnswers[q.id];
      if (answer === q.correct) {
        counts.correct++;
      } else if (answer && answer !== 'SKIPPED') {
        counts.incorrect++;
      }
    });
    return counts;
  }, [questions, userAnswers, bookmarkedQuestions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const userAnswer = userAnswers[q.id];
      if (filter === 'all') return true;
      if (filter === 'correct') return userAnswer === q.correct;
      if (filter === 'incorrect') return userAnswer && userAnswer !== q.correct && userAnswer !== 'SKIPPED';
      if (filter === 'bookmarked') return bookmarkedQuestions.includes(q.id);
      return false;
    });
  }, [filter, questions, userAnswers, bookmarkedQuestions]);

  useEffect(() => {
    setReviewIndex(0);
  }, [filter]);

  const currentQuestion = filteredQuestions[reviewIndex];

  return (
    <div className="review-section">
      <div className="review-header">
        <h2>Review Answers</h2>
        <div className="review-header-actions">
          <button onClick={onGoHome} className="home-btn">Go Home</button>
          <button onClick={onBackToScore} className="back-btn">Back to Score</button>
        </div>
      </div>
       <SegmentedControl
          options={['all', 'correct', 'incorrect', 'bookmarked']}
          selectedOptions={[filter]}
          onOptionToggle={(option) => setFilter(option as any)}
          counts={reviewCounts}
        />
      <div className="review-questions-list">
        {currentQuestion ? (
          <div key={currentQuestion.id} className="review-question-item">
            <p className="review-question-number">Question {questions.findIndex(q => q.id === currentQuestion.id) + 1}</p>
            <QuestionComponent
              question={currentQuestion}
              selectedAnswer={userAnswers[currentQuestion.id]}
              hiddenOptions={[]}
              onAnswerSelect={() => {}} // No-op for review
              zoomLevel={1}
            />
            {currentQuestion.explanation && <ExplanationComponent explanation={currentQuestion.explanation} />}
          </div>
        ) : <p>No questions match this filter.</p>}
      </div>
      {filteredQuestions.length > 1 && (
        <div className="review-navigation">
          <button onClick={() => setReviewIndex(i => i - 1)} disabled={reviewIndex === 0}>Previous</button>
          <span>{reviewIndex + 1} / {filteredQuestions.length}</span>
          <button onClick={() => setReviewIndex(i => i + 1)} disabled={reviewIndex === filteredQuestions.length - 1}>Next</button>
        </div>
      )}
    </div>
  )
}
