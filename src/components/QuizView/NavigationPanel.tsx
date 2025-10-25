import React, { useRef, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronDown, FiCheck, FiFlag } from 'react-icons/fi';
import { Question } from '../../types';

export function NavigationPanel({
  isOpen, onClose, questions, userAnswers, currentQuestionIndex,
  onJumpToQuestion, triggerRef, bookmarked, markedForReview, onSubmitAndReview
}: {
  isOpen: boolean; onClose: () => void; questions: Question[];
  userAnswers: { [key: string]: string }; currentQuestionIndex: number;
  onJumpToQuestion: (index: number) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  bookmarked: string[]; markedForReview: string[]; onSubmitAndReview: () => void;
}) {
  const portalRoot = document.getElementById('portal-root');
  const panelRef = useRef<HTMLDivElement>(null);
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  
  const chunkSize = 50;
  const questionGroups = useMemo(() => {
    const groups = [];
    for (let i = 0; i < questions.length; i += chunkSize) {
        groups.push(questions.slice(i, i + chunkSize));
    }
    return groups;
  }, [questions]);
  
  const toggleGroup = (index: number) => {
    setOpenGroups(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        return newSet;
    });
  };

  useEffect(() => {
    if (isOpen) {
      // Set the default open group
      const currentGroupIndex = Math.floor(currentQuestionIndex / chunkSize);
      setOpenGroups(new Set([currentGroupIndex]));
      
      const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];
      
      firstElement?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab' && focusableElements) {
          if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              e.preventDefault();
            }
          } else { // Tab
            if (document.activeElement === lastElement) {
              firstElement?.focus();
              e.preventDefault();
            }
          }
        }
      };

      const currentPanel = panelRef.current;
      currentPanel?.addEventListener('keydown', handleKeyDown);

      return () => {
        currentPanel?.removeEventListener('keydown', handleKeyDown);
        triggerRef.current?.focus();
      };
    }
  }, [isOpen, onClose, triggerRef, currentQuestionIndex, chunkSize]);


  if (!portalRoot) return null;

  const getStatus = (question: Question, index: number) => {
    const userAnswer = userAnswers[question.id];
    if (index === currentQuestionIndex) return 'current';
    if (!userAnswer || userAnswer === 'TIME_UP' || userAnswer === 'SKIPPED') return 'unanswered';
    if (userAnswer === question.correct) return 'correct';
    return 'incorrect';
  };

  return createPortal(
    <>
      <div className={`nav-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div 
        ref={panelRef}
        className={`nav-panel right ${isOpen ? 'open' : ''}`}
        role="dialog" aria-modal="true" aria-labelledby="nav-panel-title"
      >
        <div className="nav-header">
          <h3 id="nav-panel-title">Quiz Progress Map</h3>
          <button className="nav-close-btn" onClick={onClose} aria-label="Close navigation"><FiX/></button>
        </div>
        <div className="nav-panel-body">
            {questionGroups.map((group, groupIndex) => {
                const start = groupIndex * chunkSize + 1;
                const end = start + group.length - 1;
                const isGroupOpen = openGroups.has(groupIndex);

                return (
                    <div key={groupIndex} className="nav-question-group">
                        <button
                            className="nav-group-header"
                            onClick={() => toggleGroup(groupIndex)}
                            aria-expanded={isGroupOpen}
                        >
                            <span>Questions {start}-{end}</span>
                            <FiChevronDown className={`chevron-icon ${isGroupOpen ? 'open' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isGroupOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden' }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                >
                                    <div className="question-grid" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
                                        {group.map(q => {
                                            const overallIndex = questions.findIndex(ques => ques.id === q.id);
                                            return (
                                              <div
                                                key={q.id}
                                                className={`question-grid-item ${getStatus(q, overallIndex)}`}
                                                onClick={() => onJumpToQuestion(overallIndex)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onJumpToQuestion(overallIndex);
                                                  }
                                                }}
                                                role="button" tabIndex={0} aria-label={`Go to question ${overallIndex + 1}`}
                                              >
                                                {overallIndex + 1}
                                                {markedForReview.includes(q.id) && <span className="review-indicator"><FiFlag /></span>}
                                              </div>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
        <button className="submit-quiz-btn" onClick={onSubmitAndReview}><FiCheck/> Submit & Review All</button>
      </div>
    </>,
    portalRoot
  );
}
