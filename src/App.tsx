import React, {useEffect, useState, useRef, useContext, useMemo} from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import html2canvas from 'html2canvas';
import { FiMinimize, FiMaximize, FiMenu } from 'react-icons/fi';

import { SettingsContext } from './context/SettingsContext';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { useDependentFilters } from './hooks/useDependentFilters';
import { useFilterCounts } from './hooks/useFilterCounts';
import { useSound } from './hooks/useSound';
// FIX: Import 'filterKeys' and 'getQuestionValue' to resolve 'Cannot find name' errors.
import { Question, InitialFilters, initialFilters, filterKeys, getQuestionValue } from './types';

import { FilterSection } from './components/FilterView/FilterSection';
import { Breadcrumbs } from './components/QuizView/Breadcrumbs';
import { QuizSection } from './components/QuizView/QuizSection';
import { ScoreSection } from './components/ScoreView/ScoreSection';
import { ReviewSection } from './components/ReviewView/ReviewSection';
import { NavigationPanel } from './components/QuizView/NavigationPanel';
import { SettingsModal } from './components/modals/SettingsModal';
import { AiExplainerModal } from './components/modals/AiExplainerModal';

// --- Root Application Component ---

export function App() {
  const { isDarkMode, areAnimationsEnabled, isHapticEnabled } = useContext(SettingsContext);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  
  // State for filter options
  const [classificationMap, setClassificationMap] = useState<Map<string, Map<string, Set<string>>>>(new Map());
  const [subjects, setSubjects] = useState<string[]>([]);
  const [examNames, setExamNames] = useState<string[]>([]);
  const [examYears, setExamYears] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  
  // State for app view
  const [view, setView] = useState<'filter' | 'quiz' | 'score' | 'review'>('filter');

  // State for user's filter selections (consolidated)
  const [selectedFilters, setSelectedFilters] = useState<InitialFilters>(initialFilters);

  // State for the active quiz
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [hiddenOptions, setHiddenOptions] = useState<{[key: string]: string[]}>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useLocalStorageState<string[]>('bookmarkedQuestions', []);
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  
  // UI State
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const navTriggerRef = useRef<HTMLButtonElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  
  // Sound effects
  const playCorrectSound = useSound('https://www.fesliyanstudios.com/play-mp3/5744');
  const playIncorrectSound = useSound('https://www.fesliyanstudios.com/play-mp3/7002');

  // Refactored logic into custom hooks for cleanliness
  const { availableTopics, availableSubTopics } = useDependentFilters({
    selectedFilters,
    setSelectedFilters,
    classificationMap
  });
  const filterCounts = useFilterCounts({ allQuestions, selectedFilters });

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
      const elem = document.documentElement; // Fullscreen the whole page
      if (!document.fullscreenElement) {
          elem.requestFullscreen().catch(err => {
              alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
      } else {
          document.exitFullscreen();
      }
  };
   
  useEffect(() => {
    const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard and Swipe Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'quiz') return;
      
      const currentQuestion = quizQuestions[currentQuestionIndex];
      if (!currentQuestion) return;

      if (!userAnswers[currentQuestion.id]) {
          const keyNum = parseInt(e.key);
          if(keyNum >= 1 && keyNum <= 4) {
            const option = currentQuestion.options[keyNum - 1];
            if (option && !(hiddenOptions[currentQuestion.id] || []).includes(option)) {
              handleAnswerSelect(currentQuestion.id, option);
            }
          }
      } else {
          if(e.key === 'ArrowRight' && currentQuestionIndex < quizQuestions.length - 1) handleNextQuestion();
      }
      
      if(e.key === 'ArrowLeft' && currentQuestionIndex > 0) handlePreviousQuestion();

    };

    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
        touchStartX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        if (touchStartX - touchEndX > 75 && userAnswers[quizQuestions[currentQuestionIndex]?.id]) { // Swipe Left
            handleNextQuestion();
        }
        if (touchEndX - touchStartX > 75) { // Swipe Right
            handlePreviousQuestion();
        }
    };
    
    const quizContainer = appContainerRef.current;
    window.addEventListener('keydown', handleKeyDown);
    quizContainer?.addEventListener('touchstart', handleTouchStart);
    quizContainer?.addEventListener('touchend', handleTouchEnd);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        quizContainer?.removeEventListener('touchstart', handleTouchStart);
        quizContainer?.removeEventListener('touchend', handleTouchEnd);
    };
  }, [view, currentQuestionIndex, quizQuestions, userAnswers, hiddenOptions]);


  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('./questions.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data: Question[] = await response.json();
        setAllQuestions(data);
        (window as any).quizAppGlobals = { quizQuestions: data, userAnswers: {} };
        
        // This logic runs once to populate initial filter options
        const newClassificationMap = new Map<string, Map<string, Set<string>>>();
        const uniqueDifficulties = new Set<string>();
        const uniqueExamNames = new Set<string>();
        const uniqueExamYears = new Set<number>();
        const uniqueQuestionTypes = new Set<string>();
        const uniqueTags = new Set<string>();

        data.forEach(q => {
          const { subject, topic, subTopic } = q.classification;
          uniqueDifficulties.add(q.properties.difficulty);
          uniqueExamNames.add(q.sourceInfo.examName);
          uniqueExamYears.add(q.sourceInfo.examYear);
          uniqueQuestionTypes.add(q.properties.questionType);
          q.tags.forEach(tag => uniqueTags.add(tag));

          if (!newClassificationMap.has(subject)) {
            newClassificationMap.set(subject, new Map());
          }
          const topicsMap = newClassificationMap.get(subject)!;
          
          if (!topicsMap.has(topic)) topicsMap.set(topic, new Set());
          
          topicsMap.get(topic)!.add(subTopic);
        });
        
        setClassificationMap(newClassificationMap);
        setSubjects(Array.from(newClassificationMap.keys()).sort());
        setDifficulties(['Easy', 'Medium', 'Hard'].filter(d => uniqueDifficulties.has(d)));
        setExamNames(Array.from(uniqueExamNames).sort());
        setExamYears(Array.from(uniqueExamYears).sort((a,b) => b-a).map(String));
        setQuestionTypes(Array.from(uniqueQuestionTypes).sort());
        setTags(Array.from(uniqueTags).sort());

      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    fetchQuestions();
  }, []);
  
  // --- Filter & Quiz Logic Handlers ---
  const handleFilterChange = (filterKey: keyof InitialFilters, value: string[]) => {
      setSelectedFilters(prevFilters => ({ ...prevFilters, [filterKey]: value }));
  };

  const handleRemoveFilter = (type: keyof InitialFilters, valueToRemove: string) => {
    const currentValues = selectedFilters[type];
    const newValues = currentValues.filter(value => value !== valueToRemove);
    handleFilterChange(type, newValues);
  };

  const filteredQuestions = useMemo(() => allQuestions.filter(q => {
    return filterKeys.every(key => {
        const selected = selectedFilters[key as keyof InitialFilters];
        if (selected.length === 0) return true;

        const value = getQuestionValue(q, key as keyof InitialFilters);

        if (key === 'tags' && Array.isArray(value)) {
            return selected.some(tag => value.includes(tag));
        }
        
        if (typeof value === 'string') {
            return selected.includes(value);
        }

        return false;
    });
  }), [selectedFilters, allQuestions]);
  

  const resetQuizState = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setHiddenOptions({});
    setMarkedForReview([]);
    (window as any).quizAppGlobals.userAnswers = {};
  }

  const handleStartQuiz = (questions = filteredQuestions) => {
    if (questions.length === 0) return;
    setQuizQuestions(questions);
    (window as any).quizAppGlobals.quizQuestions = questions;
    resetQuizState();
    setView('quiz');
  };

  const handleQuickStart = (params: { difficulty?: string, count: number }) => {
    let potentialQuestions = allQuestions;
    if (params.difficulty) {
        potentialQuestions = allQuestions.filter(q => q.properties.difficulty === params.difficulty);
    }
    const shuffled = [...potentialQuestions].sort(() => 0.5 - Math.random());
    const questionsToStart = shuffled.slice(0, params.count);
    
    if (questionsToStart.length > 0) {
      handleStartQuiz(questionsToStart);
    } else {
      alert(`No questions found for difficulty: ${params.difficulty}`);
    }
  };

  const handleResetFilters = () => {
    setSelectedFilters(initialFilters);
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (userAnswers[questionId]) return;
    setUserAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: answer };
      (window as any).quizAppGlobals.userAnswers = newAnswers;
      return newAnswers;
    });

    const question = quizQuestions.find(q => q.id === questionId);
    if(question?.correct === answer) {
        playCorrectSound();
    } else {
        playIncorrectSound();
    }
    if(isHapticEnabled) navigator.vibrate(50);
  };

  const handleQuizSubmit = (targetView: 'score' | 'review') => {
    const finalAnswers = { ...userAnswers };
    quizQuestions.forEach(q => {
        if (!finalAnswers.hasOwnProperty(q.id)) {
            finalAnswers[q.id] = 'SKIPPED';
        }
    });
    setUserAnswers(finalAnswers);
    (window as any).quizAppGlobals.userAnswers = finalAnswers;
    
    setIsNavOpen(false);
    setView(targetView);
  };
  
  const handleEndQuiz = () => {
      // Mark all remaining questions as skipped
      handleQuizSubmit('score');
  }

  const handleSubmitAndReview = () => {
    if (window.confirm('Are you sure you want to submit the quiz? All unanswered questions will be marked as skipped.')) {
      handleQuizSubmit('review');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
    } else {
        handleEndQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(i => i - 1);
    }
  };

  const handleTimeUp = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (currentQuestion && !userAnswers[currentQuestion.id]) {
      handleAnswerSelect(currentQuestion.id, 'TIME_UP');
    }
  };

  const handleUseFiftyFifty = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (hiddenOptions[currentQuestion.id] || userAnswers[currentQuestion.id]) return;

    const incorrectOptions = currentQuestion.options.filter(opt => opt !== currentQuestion.correct);
    const toHide = incorrectOptions.sort(() => 0.5 - Math.random()).slice(0, 2);

    setHiddenOptions(prev => ({ ...prev, [currentQuestion.id]: toHide }));
  };
  
  const handleToggleBookmark = (questionId: string) => {
    setBookmarkedQuestions(prev => 
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );
  };

  const handleToggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => 
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );
  };

  const handleShareResults = () => {
    const scoreElement = document.getElementById('score-section-capture');
    if (scoreElement) {
      html2canvas(scoreElement, {backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff'}).then(canvas => {
        const link = document.createElement('a');
        link.download = 'quiz-results.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const handlePlayAgain = () => setView('filter');
  const handleReviewAnswers = () => setView('review');
  const handleBackToScore = () => setView('score');
  const handleGoHome = () => setView('filter');
  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsNavOpen(false);
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  // Calculate score
  const { correctAnswers, incorrectAnswers, unanswered } = useMemo(() => {
    let correct = 0;
    let incorrect = 0; // for wrongly selected answers
    let unans = 0; // for skipped, timed-out, or not yet seen

    quizQuestions.forEach(q => {
      const userAnswer = userAnswers[q.id];
      if (userAnswer === q.correct) {
        correct++;
      } else if (userAnswer && (userAnswer !== 'TIME_UP' && userAnswer !== 'SKIPPED')) {
        incorrect++;
      }
    });
    
    // Unanswered calculation depends on the view. In 'score' or 'review' view, all questions should be accounted for.
    if (view === 'score' || view === 'review') {
      unans = quizQuestions.length - (correct + incorrect);
    }

    return { correctAnswers: correct, incorrectAnswers: incorrect, unanswered: unans };
  }, [quizQuestions, userAnswers, view]);

  // Live counts for the quiz view
  const { correctCount, wrongCount } = useMemo(() => {
     let correct = 0;
     let wrong = 0;
     Object.keys(userAnswers).forEach(questionId => {
        const question = quizQuestions.find(q => q.id === questionId);
        const answer = userAnswers[questionId];
        if (question) {
            if (answer === question.correct) {
                correct++;
            } else if (answer !== 'SKIPPED') { // TIME_UP is considered wrong
                wrong++;
            }
        }
     });
     return { correctCount: correct, wrongCount: wrong };
  }, [userAnswers, quizQuestions]);


  // Animation variants and transitions
  const pageVariants = areAnimationsEnabled ? {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  } : {};

  const pageTransition: Transition = areAnimationsEnabled ? {
    type: "tween", ease: "anticipate", duration: 0.5,
  } : { duration: 0 };

  const filterOptions = {
    subjects,
    topics: availableTopics,
    subTopics: availableSubTopics,
    examNames,
    examYears,
    tags,
    difficulties,
    questionTypes
  };

  return (
    <div ref={appContainerRef} className={`app-container ${isDarkMode ? 'dark-mode' : ''} view-${view}`}>
      <AnimatePresence mode="wait">
        {view === 'filter' && allQuestions.length > 0 && (
          <motion.div
            className="page-wrapper" key="filter" initial="initial" animate="in" exit="out"
            variants={pageVariants} transition={pageTransition}
          >
            <FilterSection 
              filterOptions={filterOptions}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              filteredQuestionCount={filteredQuestions.length}
              onStartQuiz={() => handleStartQuiz()}
              onQuickStart={handleQuickStart}
              onRemoveFilter={handleRemoveFilter}
              onResetFilters={handleResetFilters}
              filterCounts={filterCounts}
            />
          </motion.div>
        )}
        
        {view === 'quiz' && currentQuestion && (
          <motion.div
            key="quiz" initial="initial" animate="in" exit="out"
            variants={pageVariants} transition={pageTransition}
          >
            <div className="quiz-top-header">
              <Breadcrumbs filters={selectedFilters} />
              <div className="logo">CGL Hustle</div>
              <div className="quiz-header-controls">
                <button className="header-control-btn" onClick={handleToggleFullscreen} aria-label="Toggle Fullscreen">
                  {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                </button>
                <button ref={navTriggerRef} className="header-control-btn" onClick={() => setIsNavOpen(true)} aria-label="Open question navigation">
                  <FiMenu />
                </button>
              </div>
            </div>
            <div className="main-content">
               <QuizSection
                question={currentQuestion} questionNumber={currentQuestionIndex + 1}
                totalQuestions={quizQuestions.length}
                userAnswer={userAnswers[currentQuestion.id]}
                hiddenOptions={hiddenOptions[currentQuestion.id] || []}
                onAnswerSelect={(answer) => handleAnswerSelect(currentQuestion.id, answer)}
                onNextQuestion={handleNextQuestion} onPreviousQuestion={handlePreviousQuestion}
                isFiftyFiftyUsed={!!hiddenOptions[currentQuestion.id]} onUseFiftyFifty={handleUseFiftyFifty}
                onTimeUp={handleTimeUp}
                isBookmarked={bookmarkedQuestions.includes(currentQuestion.id)}
                onToggleBookmark={() => handleToggleBookmark(currentQuestion.id)}
                isMarkedForReview={markedForReview.includes(currentQuestion.id)}
                onToggleMarkForReview={() => handleToggleMarkForReview(currentQuestion.id)}
                zoomLevel={zoomLevel} onZoomIn={() => setZoomLevel(z => Math.min(z + 0.1, 2))} onZoomOut={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))}
                onOpenAiModal={() => setIsAiModalOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                correctCount={correctCount}
                wrongCount={wrongCount}
               />
            </div>
          </motion.div>
        )}

        {view === 'score' && (
          <motion.div
            className="page-wrapper" key="score" initial="initial" animate="in" exit="out"
            variants={pageVariants} transition={pageTransition}
          >
            <ScoreSection 
              correct={correctAnswers} incorrect={incorrectAnswers} unanswered={unanswered}
              onPlayAgain={handlePlayAgain} onReviewAnswers={handleReviewAnswers}
              onShare={handleShareResults}
            />
          </motion.div>
        )}

        {view === 'review' && (
          <motion.div
            className="page-wrapper" key="review" initial="initial" animate="in" exit="out"
            variants={pageVariants} transition={pageTransition}
          >
            <ReviewSection
              questions={quizQuestions} userAnswers={userAnswers}
              onBackToScore={handleBackToScore} bookmarkedQuestions={bookmarkedQuestions}
              onGoHome={handleGoHome}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {quizQuestions.length > 0 && (
        <NavigationPanel 
          isOpen={isNavOpen && view === 'quiz'} onClose={() => setIsNavOpen(false)}
          questions={quizQuestions} userAnswers={userAnswers}
          currentQuestionIndex={currentQuestionIndex}
          onJumpToQuestion={handleJumpToQuestion}
          triggerRef={navTriggerRef}
          bookmarked={bookmarkedQuestions}
          markedForReview={markedForReview}
          onSubmitAndReview={handleSubmitAndReview}
        />
      )}
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AnimatePresence>
        {isAiModalOpen && <AiExplainerModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />}
      </AnimatePresence>

      {view === 'filter' && allQuestions.length === 0 && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading questions...</p>
          </div>
      )}
    </div>
  );
}