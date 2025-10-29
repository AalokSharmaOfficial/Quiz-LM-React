import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHelpCircle, FiChevronDown, FiZoomOut, FiZoomIn, FiSettings } from 'react-icons/fi';
import { FaMagic } from 'react-icons/fa';
import { Question } from '../../types';
import { useTimer } from '../../hooks/useTimer';
import { OverallProgressBar } from './OverallProgressBar';
import { QuizStatsBar } from './QuizStatsBar';
import { QuestionInfo } from './QuestionInfo';
import { QuestionComponent } from './QuestionComponent';
import { ExplanationComponent } from './ExplanationComponent';
import { QuizBottomNav } from './QuizBottomNav';

const QUIZ_DURATION_SECONDS = 60;

export function QuizSection({
    question, questionNumber, totalQuestions, userAnswer, hiddenOptions,
    onAnswerSelect, onNextQuestion, onPreviousQuestion,
    isFiftyFiftyUsed, onUseFiftyFifty, onTimeUp,
    isBookmarked, onToggleBookmark, isMarkedForReview, onToggleMarkForReview,
    zoomLevel, onZoomIn, onZoomOut, onOpenAiModal, onOpenSettings,
    correctCount, wrongCount, onScroll
}: {
    question: Question; questionNumber: number; totalQuestions: number;
    userAnswer?: string; hiddenOptions: string[];
    onAnswerSelect: (answer: string) => void;
    onNextQuestion: () => void; onPreviousQuestion: () => void;
    isFiftyFiftyUsed: boolean; onUseFiftyFifty: () => void;
    onTimeUp: () => void; 
    isBookmarked: boolean; onToggleBookmark: () => void;
    isMarkedForReview: boolean; onToggleMarkForReview: () => void;
    zoomLevel: number; onZoomIn: () => void; onZoomOut: () => void;
    onOpenAiModal: () => void; onOpenSettings: () => void;
    correctCount: number; wrongCount: number;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}) {
    const isAnswered = !!userAnswer;
    const remainingCount = totalQuestions - (correctCount + wrongCount);
    const [isStatsVisible, setIsStatsVisible] = useState(true);

    // Timer logic
    const [secondsLeft] = useTimer({ 
        duration: QUIZ_DURATION_SECONDS, 
        onTimeUp, 
        key: question.id, 
        isPaused: isAnswered 
    });
    const progress = (secondsLeft / QUIZ_DURATION_SECONDS) * 100;
    const isEnding = secondsLeft <= 10;

    // Flash effect logic
    const [flashClass, setFlashClass] = useState('');
    useEffect(() => {
        if(isAnswered) {
          const isCorrect = userAnswer === question.correct;
          setFlashClass(isCorrect ? 'correct-flash' : 'incorrect-flash');
          const timer = setTimeout(() => setFlashClass(''), 500);
          return () => clearTimeout(timer);
        } else {
          setFlashClass('');
        }
    }, [isAnswered, userAnswer, question.correct]);

    return (
        <div className="quiz-section-card">
            <div className="quiz-main-header">
                <h3 className="quiz-subject-header">{question.classification.subject} <FiHelpCircle /></h3>
                <button
                    className="quiz-collapsible-trigger"
                    onClick={() => setIsStatsVisible(!isStatsVisible)}
                    aria-expanded={isStatsVisible}
                    aria-controls="quiz-stats-collapsible"
                >
                    <FiChevronDown className={`chevron-icon ${isStatsVisible ? 'open' : ''}`} />
                </button>
            </div>
            
            <AnimatePresence>
                {isStatsVisible && (
                    <motion.div
                        id="quiz-stats-collapsible"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <OverallProgressBar current={questionNumber - 1} total={totalQuestions} />
                        <QuizStatsBar correct={correctCount} wrong={wrongCount} remaining={remainingCount} />
                        <div className="quiz-controls-toolbar">
                            <button className="timer-btn">Time Left: {secondsLeft}s</button>
                            <div className="quiz-tools">
                                <button className="tool-btn" onClick={onZoomOut} disabled={zoomLevel <= 0.5} aria-label="Zoom out"><FiZoomOut /></button>
                                <button className="tool-btn" onClick={onZoomIn} disabled={zoomLevel >= 2} aria-label="Zoom in"><FiZoomIn /></button>
                                <button className="tool-btn ai-explainer-btn" onClick={onOpenAiModal} disabled={!isAnswered} aria-label="AI Explainer"><FaMagic/></button>
                                <button className="tool-btn fifty-fifty-btn" onClick={onUseFiftyFifty} disabled={isFiftyFiftyUsed || isAnswered}>50:50</button>
                                <button className="tool-btn" onClick={onOpenSettings} aria-label="Open settings"><FiSettings /></button>
                            </div>
                        </div>
                         <div className="timer-bar-container">
                            <div 
                                className={`timer-bar ${isEnding && !isAnswered ? 'ending' : ''} ${flashClass}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="quiz-scrollable-content" onScroll={onScroll}>
                <QuestionInfo 
                    question={question} 
                    currentIndex={questionNumber - 1} 
                    total={totalQuestions}
                    isBookmarked={isBookmarked}
                    onToggleBookmark={onToggleBookmark}
                />
                <QuestionComponent
                    question={question}
                    selectedAnswer={userAnswer}
                    hiddenOptions={hiddenOptions}
                    onAnswerSelect={onAnswerSelect}
                    zoomLevel={zoomLevel}
                />
                {userAnswer && (
                    <AnimatePresence>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <ExplanationComponent explanation={question.explanation} />
                      </motion.div>
                    </AnimatePresence>
                )}
            </div>
             <QuizBottomNav
                onPrevious={onPreviousQuestion}
                onNext={onNextQuestion}
                onToggleMarkForReview={onToggleMarkForReview}
                isMarked={isMarkedForReview}
                isFirst={questionNumber === 1}
                isLast={questionNumber === totalQuestions}
                isAnswered={!!userAnswer}
            />
        </div>
    );
}
