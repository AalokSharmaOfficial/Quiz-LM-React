import React, { useMemo } from 'react';
import { DonutChart } from './DonutChart';
import { Question } from '../../types';
import { FiTarget, FiCheckSquare, FiTrendingUp, FiShare2 } from 'react-icons/fi';

const PerformanceBar = ({ subject, accuracy }: { subject: string, accuracy: number }) => {
  const getBarColor = () => {
    if (accuracy > 75) return 'high';
    if (accuracy > 40) return 'medium';
    return 'low';
  };

  return (
    <div className="subject-performance-item">
      <span className="subject-name">{subject} ({accuracy.toFixed(0)}%)</span>
      <div className="performance-bar-container">
        <div 
          className={`performance-bar-fill ${getBarColor()}`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
    </div>
  );
};


export function ScoreSection({
  quizQuestions, userAnswers, onPlayAgain, onReviewAnswers, onReviewIncorrect, onShare, timePerQuestion
}: {
  quizQuestions: Question[];
  userAnswers: { [key: string]: string };
  onPlayAgain: () => void;
  onReviewAnswers: () => void;
  onReviewIncorrect: () => void;
  onShare: () => void;
  timePerQuestion: { [key: string]: number };
}) {
  const { correct, incorrect, unanswered, attempted } = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let attempted = 0;

    quizQuestions.forEach(q => {
      const answer = userAnswers[q.id];
      if (answer && answer !== 'SKIPPED') {
        attempted++;
        if (answer === q.correct) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });
    const unanswered = quizQuestions.length - attempted;
    return { correct, incorrect, unanswered, attempted };
  }, [quizQuestions, userAnswers]);

  const total = quizQuestions.length;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  const performanceBySubject = useMemo(() => {
    const subjects: { [key: string]: { total: number, correct: number } } = {};
    quizQuestions.forEach(q => {
      const subject = q.classification.subject;
      if (!subjects[subject]) {
        subjects[subject] = { total: 0, correct: 0 };
      }
      subjects[subject].total++;
      if (userAnswers[q.id] === q.correct) {
        subjects[subject].correct++;
      }
    });

    return Object.entries(subjects).map(([subject, data]) => ({
      subject,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0
    })).sort((a,b) => b.accuracy - a.accuracy);
  }, [quizQuestions, userAnswers]);

  const performanceByTopic = useMemo(() => {
    const topics: { [key: string]: { total: number, correct: number, subject: string } } = {};
    quizQuestions.forEach(q => {
      const topic = q.classification.topic;
      const subject = q.classification.subject;
      if (!topics[topic]) {
        topics[topic] = { total: 0, correct: 0, subject: subject };
      }
      topics[topic].total++;
      if (userAnswers[q.id] === q.correct) {
        topics[topic].correct++;
      }
    });

    return Object.entries(topics)
      .filter(([, data]) => data.total > 1)
      .map(([topic, data]) => ({
      topic,
      subject: data.subject,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    })).sort((a,b) => b.accuracy - a.accuracy);
  }, [quizQuestions, userAnswers]);

  const timeAnalysis = useMemo(() => {
    let correctTimeSum = 0;
    let correctCount = 0;
    let incorrectTimeSum = 0;
    let incorrectCount = 0;

    quizQuestions.forEach(q => {
      const answer = userAnswers[q.id];
      const time = timePerQuestion[q.id];

      if (answer && time !== undefined && answer !== 'SKIPPED') {
        if (answer === q.correct) {
          correctTimeSum += time;
          correctCount++;
        } else {
          incorrectTimeSum += time;
          incorrectCount++;
        }
      }
    });

    return {
      avgCorrectTime: correctCount > 0 ? (correctTimeSum / correctCount).toFixed(1) : 'N/A',
      avgIncorrectTime: incorrectCount > 0 ? (incorrectTimeSum / incorrectCount).toFixed(1) : 'N/A',
    };
  }, [quizQuestions, userAnswers, timePerQuestion]);

  let title = '';
  if (accuracy > 80) title = "Quiz Master!";
  else if (accuracy > 50) title = "Great Effort!";
  else title = "Keep Practicing!";

  return (
    <div id="score-section-capture" className="score-section">
      <div className="score-header">
        <h2 className="score-title">{title}</h2>
        <p className="score-message">Here's your performance breakdown.</p>
      </div>

      <div className="score-kpi-grid">
        <div className="kpi-item">
          <span className="kpi-value">{total}</span>
          <span className="kpi-label"><FiTarget /> Total</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-value">{attempted}</span>
          <span className="kpi-label"><FiCheckSquare /> Attempted</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-value">{accuracy}%</span>
          <span className="kpi-label"><FiTrendingUp /> Accuracy</span>
        </div>
      </div>
      
      <div className="score-breakdown">
        <h3>Attempt Breakdown</h3>
        <div className="attempt-details">
          <DonutChart correct={correct} incorrect={incorrect} unanswered={unanswered} attempted={attempted} />
          <div className="attempt-legend">
            <ul>
              <li>
                <span className="legend-label">
                  <span className="legend-dot correct"></span>Correct
                </span>
                <span className="legend-value">{correct}</span>
              </li>
              <li>
                <span className="legend-label">
                  <span className="legend-dot incorrect"></span>Incorrect
                </span>
                <span className="legend-value">{incorrect}</span>
              </li>
              <li>
                <span className="legend-label">
                  <span className="legend-dot unanswered"></span>Unanswered
                </span>
                <span className="legend-value">{unanswered}</span>
              </li>
            </ul>
            <button 
              className="review-incorrect-btn"
              onClick={onReviewIncorrect}
              disabled={incorrect === 0}
            >
              Review Incorrect Answers →
            </button>
          </div>
        </div>
      </div>
      
       <div className="performance-analysis">
          <h3>Time Analysis</h3>
          <div className="time-analysis-grid">
              <div className="time-analysis-item">
                  <span className="time-label">Avg. Time / Correct Answer</span>
                  <span className="time-value">{timeAnalysis.avgCorrectTime}s</span>
              </div>
              <div className="time-analysis-item">
                  <span className="time-label">Avg. Time / Incorrect Answer</span>
                  <span className="time-value">{timeAnalysis.avgIncorrectTime}s</span>
              </div>
          </div>
        </div>
      
      {performanceBySubject.length > 1 && (
        <div className="performance-analysis">
          <h3>Performance by Subject</h3>
          {performanceBySubject.map(item => (
            <PerformanceBar key={item.subject} subject={item.subject} accuracy={item.accuracy} />
          ))}
        </div>
      )}
      
      {performanceByTopic.length > 0 && (
        <div className="performance-analysis">
          <h3>Performance by Topic</h3>
          {performanceByTopic.map(item => (
            <PerformanceBar key={item.topic} subject={`${item.subject} - ${item.topic}`} accuracy={item.accuracy} />
          ))}
        </div>
      )}

      <div className="score-actions">
        <button className="share-results-btn" onClick={onShare}>
          <FiShare2 /> Share Results
        </button>
        <button className="review-answers-btn" onClick={onReviewAnswers}>
          Review All
        </button>
        <button className="play-again-btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
