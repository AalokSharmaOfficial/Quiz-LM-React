/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useEffect, useState, useRef, createContext, useContext, useMemo} from 'react';
import { createPortal } from 'react-dom';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { marked } from 'marked';
import html2canvas from 'html2canvas';
import { FiSettings, FiArchive, FiTag, FiRefreshCw, FiHelpCircle, FiZoomIn, FiZoomOut, FiMenu, FiChevronsRight, FiX, FiCheck, FiStar, FiFlag, FiMaximize, FiMinimize, FiClock, FiChevronDown } from 'react-icons/fi';
import { FaRocket, FaSitemap, FaRegStar, FaStar, FaMagic } from 'react-icons/fa';
import './index.css';


// --- Type Definitions for New Data Structure ---

interface SourceInfo {
  examName: string;
  examYear: number;
  examDateShift: string;
}

interface Classification {
  subject: string;
  topic: string;
  subTopic: string;
}

interface Properties {
  difficulty: string;
  questionType: string;
}

interface Explanation {
  summary: string;
  analysis_correct: string;
  analysis_incorrect: string;
  conclusion: string;
  fact: string;
}

interface Question {
  id: number;
  sourceInfo: SourceInfo;
  classification: Classification;
  tags: string[];
  properties: Properties;
  question: string;
  question_hi: string;
  options: string[];
  options_hi: string[];
  correct: string;
  explanation: Explanation;
}

// --- Custom Hooks for Reusable Logic ---

/**
 * A custom hook to manage state that is persisted in localStorage.
 */
function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save state to localStorage:", error);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * A custom hook to manage a countdown timer.
 */
function useTimer({ duration, onTimeUp, key, isPaused }: { duration: number; onTimeUp: () => void; key: any; isPaused: boolean; }): [number, () => void] {
    const [secondsLeft, setSecondsLeft] = useState(duration);
    const intervalRef = useRef<number | null>(null);

    const resetTimer = () => {
        setSecondsLeft(duration);
    };

    useEffect(() => {
        if (isPaused) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        resetTimer();

        intervalRef.current = window.setInterval(() => {
            setSecondsLeft(prevSeconds => {
                if (prevSeconds <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    onTimeUp();
                    return 0;
                }
                return prevSeconds - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [key, duration, isPaused, onTimeUp]);

    return [secondsLeft, resetTimer];
}

const initialFilters = {
  subject: [],
  topic: [],
  subTopic: [],
  examName: [],
  examYear: [],
  tags: [],
  difficulty: [],
  questionType: []
};

const filterKeys: (keyof typeof initialFilters)[] = [
    'subject', 'topic', 'subTopic', 'examName', 'examYear', 'tags', 'difficulty', 'questionType'
];

// Helper to get nested value from question object
const getQuestionValue = (question: Question, key: keyof typeof initialFilters): string | string[] | undefined => {
    switch (key) {
        case 'subject': return question.classification.subject;
        case 'topic': return question.classification.topic;
        case 'subTopic': return question.classification.subTopic;
        case 'examName': return question.sourceInfo.examName;
        case 'examYear': return String(question.sourceInfo.examYear);
        case 'tags': return question.tags;
        case 'difficulty': return question.properties.difficulty;
        case 'questionType': return question.properties.questionType;
        default: return undefined;
    }
}


/**
 * Custom Hook: Manages the cascading logic for dependent filters (Subject -> Topic -> Sub-Topic).
 * It calculates available options and resets child filters when a parent filter changes.
 */
function useDependentFilters({ selectedFilters, setSelectedFilters, classificationMap }) {
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableSubTopics, setAvailableSubTopics] = useState<string[]>([]);
  const isInitialMount = useRef(true);

  // Effect to update available topics and reset child filters when subject changes
  useEffect(() => {
    const newTopics = new Set<string>();
    if (selectedFilters.subject.length > 0) {
      selectedFilters.subject.forEach(subject => {
        classificationMap.get(subject)?.forEach((_, topic) => newTopics.add(topic));
      });
    }
    setAvailableTopics(Array.from(newTopics).sort());

    if (!isInitialMount.current) {
      setSelectedFilters(prev => ({
          ...prev,
          topic: [],
          subTopic: [],
      }));
    }
  }, [selectedFilters.subject, classificationMap, setSelectedFilters]);

  // Effect to update available sub-topics and reset child filters when topic changes
  useEffect(() => {
    const newSubTopics = new Set<string>();
    if (selectedFilters.topic.length > 0 && selectedFilters.subject.length > 0) {
      selectedFilters.subject.forEach(subject => {
        const topicsMap = classificationMap.get(subject);
        if (topicsMap) {
          selectedFilters.topic.forEach(topic => {
            topicsMap.get(topic)?.forEach(subTopic => newSubTopics.add(subTopic));
          });
        }
      });
    }
    setAvailableSubTopics(Array.from(newSubTopics).sort());

    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setSelectedFilters(prev => ({
        ...prev,
        subTopic: [],
      }));
    }
  }, [selectedFilters.topic, selectedFilters.subject, classificationMap, setSelectedFilters]);

  return { availableTopics, availableSubTopics };
}

/**
 * Custom Hook: Calculates the contextual "Smart Filter Counts" for all filter options.
 * The count for each option is determined by applying all *other* active filters.
 */
function useFilterCounts({ allQuestions, selectedFilters }) {
  return useMemo(() => {
    const allCounts: { [key: string]: { [key: string]: number } } = {};

    for (const keyToCount of filterKeys) {
        const contextualFilters = { ...selectedFilters, [keyToCount]: [] };
        
        const tempFilteredQuestions = allQuestions.filter(q => {
            return filterKeys.every(key => {
                if (key === keyToCount) return true; // Ignore the key we are counting for

                const selected = contextualFilters[key as keyof typeof initialFilters];
                if (selected.length === 0) return true;

                const value = getQuestionValue(q, key as keyof typeof initialFilters);
                if (key === 'tags' && Array.isArray(value)) {
                    return selected.some(tag => value.includes(tag));
                }
                if (typeof value === 'string') {
                    return selected.includes(value);
                }
                return false;
            });
        });

        const counts: { [key: string]: number } = {};
        for (const question of tempFilteredQuestions) {
            const value = getQuestionValue(question, keyToCount);
            if (Array.isArray(value)) {
                value.forEach(tag => {
                    counts[tag] = (counts[tag] || 0) + 1;
                });
            } else if (value) {
                counts[value] = (counts[value] || 0) + 1;
            }
        }
        allCounts[keyToCount] = counts;
    }
    return allCounts;
  }, [selectedFilters, allQuestions]);
}


// --- Settings Context for Theme & Features ---

interface SettingsContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  areAnimationsEnabled: boolean;
  toggleAnimations: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isHapticEnabled: boolean;
  toggleHaptics: () => void;
  areBgAnimationsEnabled: boolean;
  toggleBgAnimations: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  areAnimationsEnabled: true,
  toggleAnimations: () => {},
  isSoundEnabled: true,
  toggleSound: () => {},
  isHapticEnabled: true,
  toggleHaptics: () => {},
  areBgAnimationsEnabled: true,
  toggleBgAnimations: () => {},
});

// FIX: Made children optional to satisfy TypeScript compiler. The component is always used with children, so this may be a toolchain issue.
const SettingsProvider = ({ children }: { children?: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useLocalStorageState('darkMode', false);
  const [areAnimationsEnabled, setAreAnimationsEnabled] = useLocalStorageState('animationsEnabled', true);
  const [isSoundEnabled, setIsSoundEnabled] = useLocalStorageState('soundEnabled', true);
  const [isHapticEnabled, setIsHapticEnabled] = useLocalStorageState('hapticsEnabled', true);
  const [areBgAnimationsEnabled, setAreBgAnimationsEnabled] = useLocalStorageState('bgAnimationsEnabled', true);

  useEffect(() => {
    document.body.dataset.theme = isDarkMode ? 'dark' : 'light';
    if (areBgAnimationsEnabled) {
      document.body.classList.add('background-animated');
    } else {
      document.body.classList.remove('background-animated');
    }
  }, [isDarkMode, areBgAnimationsEnabled]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleAnimations = () => setAreAnimationsEnabled(prev => !prev);
  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
    // Placeholder for sound logic
  }
  const toggleHaptics = () => {
    setIsHapticEnabled(prev => !prev);
    if (navigator.vibrate && !isHapticEnabled) {
      navigator.vibrate(50);
    }
  }
  const toggleBgAnimations = () => setAreBgAnimationsEnabled(prev => !prev);


  return (
    <SettingsContext.Provider value={{ 
      isDarkMode, toggleDarkMode,
      areAnimationsEnabled, toggleAnimations,
      isSoundEnabled, toggleSound,
      isHapticEnabled, toggleHaptics,
      areBgAnimationsEnabled, toggleBgAnimations
    }}>
      {children}
    </SettingsContext.Provider>
  );
};


const QUIZ_DURATION_SECONDS = 60;

// --- Sound Player Hook ---
const useSound = (url: string) => {
    const { isSoundEnabled } = useContext(SettingsContext);
    const audio = useMemo(() => typeof Audio !== "undefined" ? new Audio(url) : undefined, [url]);
    
    const play = () => {
        if (isSoundEnabled && audio) {
            audio.play().catch(e => console.error("Sound play failed:", e));
        }
    };
    
    return play;
};


// --- Reusable UI Components ---

// FIX: Made children optional to satisfy TypeScript compiler. The component is always used with children, so this may be a toolchain issue.
function FilterGroup({ title, icon, children }: { title: string; icon: React.ReactElement; children?: React.ReactNode }) {
  return (
    <fieldset className="filter-group">
      <legend>{icon}{title}</legend>
      <div className="filter-group-content">
        {children}
      </div>
    </fieldset>
  );
}

// FIX: Made children optional to satisfy TypeScript compiler. The component is always used with children, so this may be a toolchain issue.
function FilterControl({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="filter-control">
      <label>{label}</label>
      {children}
    </div>
  );
}

function MultiSelectDropdown({ 
  options, 
  selectedOptions, 
  onSelectionChange,
  placeholder = 'Select Options',
  disabled = false,
  counts
}: { 
  options: string[]; 
  selectedOptions: string[]; 
  onSelectionChange: (selected: string[]) => void; 
  placeholder?: string;
  disabled?: boolean;
  counts?: { [key: string]: number };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleOptionToggle = (option: string) => {
    const newSelection = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    onSelectionChange(newSelection);
  };
  
  const getDisplayText = () => {
      if (selectedOptions.length === 0) {
        return <span className="placeholder">{placeholder}</span>;
      }
      if (selectedOptions.length > 2) {
        const type = placeholder.replace('Select ', '');
        return `${selectedOptions.length} ${type} selected`;
      }
      return selectedOptions.join(', ');
  };

  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      <button 
        ref={buttonRef}
        className="dropdown-button" 
        onClick={() => setIsOpen(!isOpen)} 
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span>{getDisplayText()}</span>
        <i className={`arrow ${isOpen ? 'open' : ''}`}></i>
      </button>
      {isOpen && (
        <ul className="dropdown-menu" role="listbox">
          {options.map(option => {
            const count = counts?.[option] || 0;
            const isSelected = selectedOptions.includes(option);
            const isDisabled = !isSelected && count === 0;
            return (
              <li key={option} role="option" aria-selected={isSelected}>
                <button onClick={() => handleOptionToggle(option)} disabled={isDisabled}>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    readOnly
                    tabIndex={-1}
                  />
                  {option}
                  <span className="filter-option-count">({count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SegmentedControl({ 
  options, 
  selectedOptions, 
  onOptionToggle,
  counts
}: { 
  options: string[]; 
  selectedOptions: string[]; 
  onOptionToggle: (option: string) => void;
  counts?: { [key: string]: number };
}) {
  return (
    <div className="segmented-control" role="group">
      {options.map(option => {
        const count = counts?.[option] || 0;
        const isSelected = selectedOptions.includes(option);
        const isDisabled = !isSelected && count === 0;

        return (
          <button 
            key={option} 
            className={isSelected ? 'active' : ''} 
            onClick={() => onOptionToggle(option)}
            disabled={isDisabled}
            role="checkbox" 
            aria-checked={isSelected}
          >
            {option} <span className="filter-option-count">({count})</span>
          </button>
        )
      })}
    </div>
  );
}

function QuickStartButtons({ onQuickStart }: { onQuickStart: (params: { difficulty?: string, count: number }) => void }) {
  return (
    <div className="quick-start-container">
      <legend><FaRocket /> Quick Start</legend>
      <div className="quick-start-buttons">
        <button onClick={() => onQuickStart({ difficulty: 'Easy', count: 25 })}>Quick 25 Easy</button>
        <button onClick={() => onQuickStart({ difficulty: 'Medium', count: 25 })}>Quick 25 Moderate</button>
        <button onClick={() => onQuickStart({ difficulty: 'Hard', count: 25 })}>Quick 25 Hard</button>
        <button onClick={() => onQuickStart({ count: 25 })}>Quick 25 Mix Level</button>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useContext(SettingsContext);
  return (
    <div className="theme-toggle">
      <label className="theme-toggle-label">
        <input 
          type="checkbox" 
          checked={isDarkMode}
          onChange={toggleDarkMode}
        />
        <span className="slider"></span>
      </label>
    </div>
  )
}

function SettingsToggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <div className="setting-item">
       <label htmlFor={`setting-${label}`}>{label}</label>
       <div className="theme-toggle">
          <label htmlFor={`setting-${label}`} className="theme-toggle-label">
            <input 
              id={`setting-${label}`}
              type="checkbox" 
              checked={checked}
              onChange={onChange}
            />
            <span className="slider"></span>
          </label>
        </div>
    </div>
  );
}



// --- Main View Components ---

function ActiveFiltersBar({
  selectedFilters,
  onRemoveFilter
} : {
  selectedFilters: typeof initialFilters,
  onRemoveFilter: (type: keyof typeof initialFilters, value: string) => void;
}) {
  const filters = Object.entries(selectedFilters)
    .flatMap(([type, values]) => 
      values.map(value => ({ type: type as keyof typeof initialFilters, value }))
    );

  if (filters.length === 0) return null;

  return (
    <div className="active-filters-bar">
      <AnimatePresence>
        {filters.map(({type, value}) => (
          <motion.div
            key={`${type}-${value}`}
            className="filter-pill"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {value}
            <button onClick={() => onRemoveFilter(type, value)} aria-label={`Remove ${value} filter`}>&times;</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function FilterSection({ 
  filterOptions,
  selectedFilters,
  onFilterChange,
  filteredQuestionCount,
  onStartQuiz,
  onQuickStart,
  onRemoveFilter,
  onResetFilters,
  filterCounts,
}: { 
  filterOptions: {
    subjects: string[];
    topics: string[];
    subTopics: string[];
    examNames: string[];
    examYears: string[];
    tags: string[];
    difficulties: string[];
    questionTypes: string[];
  };
  selectedFilters: typeof initialFilters;
  onFilterChange: (filterKey: keyof typeof initialFilters, value: string[]) => void;
  filteredQuestionCount: number;
  onStartQuiz: () => void;
  onQuickStart: (params: { difficulty?: string, count: number }) => void;
  onRemoveFilter: (type: keyof typeof initialFilters, value: string) => void;
  onResetFilters: () => void;
  filterCounts: { [key: string]: { [key: string]: number } };
}) {
  const handleToggleFilterValue = (type: keyof typeof initialFilters, valueToToggle: string) => {
    const currentValues = selectedFilters[type];
    const newValues = currentValues.includes(valueToToggle)
        ? currentValues.filter(value => value !== valueToToggle)
        : [...currentValues, valueToToggle];
    onFilterChange(type, newValues);
  };
  
  return (
    <div className="filter-section">
      <div className="filter-section-header">
        <h1>Customize Your Quiz</h1>
        <p>Select your criteria to build a targeted practice session, or get started instantly.</p>
      </div>

      <QuickStartButtons onQuickStart={onQuickStart} />
      
      <ActiveFiltersBar 
        selectedFilters={selectedFilters}
        onRemoveFilter={onRemoveFilter}
      />

      <div className="filter-groups-grid">
        <FilterGroup title="By Classification" icon={<FaSitemap />}>
          <FilterControl label="Subject">
            <MultiSelectDropdown 
              options={filterOptions.subjects} 
              selectedOptions={selectedFilters.subject} 
              onSelectionChange={(v) => onFilterChange('subject', v)} 
              placeholder="Select Subjects"
              counts={filterCounts.subject}
            />
          </FilterControl>
          <FilterControl label="Topic">
            <MultiSelectDropdown 
              options={filterOptions.topics} 
              selectedOptions={selectedFilters.topic} 
              onSelectionChange={(v) => onFilterChange('topic', v)}
              placeholder="Select a Subject first"
              disabled={selectedFilters.subject.length === 0}
              counts={filterCounts.topic}
            />
          </FilterControl>
          <FilterControl label="Sub-Topic">
            <MultiSelectDropdown 
              options={filterOptions.subTopics} 
              selectedOptions={selectedFilters.subTopic} 
              onSelectionChange={(v) => onFilterChange('subTopic', v)}
              placeholder="Select a Topic first"
              disabled={selectedFilters.topic.length === 0}
              counts={filterCounts.subTopic}
            />
          </FilterControl>
        </FilterGroup>

        <FilterGroup title="By Properties" icon={<FiSettings />}>
          <FilterControl label="Difficulty">
              <SegmentedControl
                options={filterOptions.difficulties}
                selectedOptions={selectedFilters.difficulty}
                onOptionToggle={(v) => handleToggleFilterValue('difficulty', v)}
                counts={filterCounts.difficulty}
              />
          </FilterControl>
          <FilterControl label="Question Type">
            <SegmentedControl
                options={filterOptions.questionTypes}
                selectedOptions={selectedFilters.questionType}
                onOptionToggle={(v) => handleToggleFilterValue('questionType', v)}
                counts={filterCounts.questionType}
              />
          </FilterControl>
        </FilterGroup>

        <FilterGroup title="By Source" icon={<FiArchive />}>
          <FilterControl label="Exam Name">
            <MultiSelectDropdown 
              options={filterOptions.examNames} 
              selectedOptions={selectedFilters.examName} 
              onSelectionChange={(v) => onFilterChange('examName', v)}
              placeholder="Select Exam Names"
              counts={filterCounts.examName}
            />
          </FilterControl>
          <FilterControl label="Exam Year">
            <MultiSelectDropdown 
              options={filterOptions.examYears} 
              selectedOptions={selectedFilters.examYear} 
              onSelectionChange={(v) => onFilterChange('examYear', v)}
              placeholder="Select Exam Years"
              counts={filterCounts.examYear}
            />
          </FilterControl>
        </FilterGroup>

        <FilterGroup title="By Tags" icon={<FiTag />}>
          <FilterControl label="Tag">
            <MultiSelectDropdown 
              options={filterOptions.tags} 
              selectedOptions={selectedFilters.tags} 
              onSelectionChange={(v) => onFilterChange('tags', v)}
              placeholder="Select Tags"
              counts={filterCounts.tags}
            />
          </FilterControl>
        </FilterGroup>
      </div>
      
      <div className="filter-actions">
        <button onClick={onResetFilters} className="reset-filters-btn">
          <FiRefreshCw /> Reset Filters
        </button>
        <button 
          className="start-quiz-btn" 
          onClick={onStartQuiz}
          disabled={filteredQuestionCount === 0}
        >
          {filteredQuestionCount > 0 
            ? `Start Quiz (${filteredQuestionCount} Questions)` 
            : 'No Questions Found'
          }
        </button>
      </div>
    </div>
  );
}

// --- Quiz View Components ---
function Breadcrumbs({ filters }: { filters: typeof initialFilters }) {
  const crumbs = ['Filters'];
  if (filters.subject.length) crumbs.push(filters.subject.join(', '));
  if (filters.topic.length) crumbs.push(filters.topic.join(', '));
  if (filters.subTopic.length) crumbs.push(filters.subTopic.join(', '));
  if (filters.difficulty.length) crumbs.push(filters.difficulty.join(', '));
  
  return (
    <div className="breadcrumbs">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          <span>{crumb}</span>
          {index < crumbs.length - 1 && <FiChevronsRight />}
        </React.Fragment>
      ))}
    </div>
  );
}

function QuizStatsBar({ correct, wrong, remaining }: { correct: number, wrong: number, remaining: number }) {
  return (
    <div className="quiz-stats-bar">
      <span><FiCheck /> Correct: {correct}</span>
      <span><FiX /> Wrong/Timeout: {wrong}</span>
      <span><FiClock /> Remaining: {remaining}</span>
    </div>
  );
}

function ExplanationComponent({ explanation }: { explanation: Explanation }) {
    const renderSection = (title: string, content: string, icon: string, className: string) => {
        if (!content) return null;
        const htmlContent = marked.parse(content.replace(/✅ |❌ |📝 |💡 /g, ''));
        return (
            <div className={`explanation-section ${className}`}>
                <h4>{icon} {title}</h4>
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
        );
    };

    return (
        <div className="explanation-box">
            {explanation.summary && <div className="explanation-summary">{explanation.summary.replace('Correct Answer: ', 'Correct Answer: ')}</div>}
            {renderSection('Why this is correct', explanation.analysis_correct, '✅', 'correct-analysis')}
            {renderSection('Why other options are incorrect', explanation.analysis_incorrect, '❌', 'incorrect-analysis')}
            {renderSection('Concluding Note', explanation.conclusion, '📝', 'conclusion-note')}
            {renderSection('Interesting Fact', explanation.fact, '💡', 'interesting-fact')}
        </div>
    );
}

function Option({
    option,
    option_hi,
    isSelected,
    isCorrect,
    isAnswered,
    isHidden,
    onClick
}: {
    option: string;
    option_hi: string;
    isSelected: boolean;
    isCorrect: boolean;
    isAnswered: boolean;
    isHidden: boolean;
    onClick: () => void;
}) {
    const classNames = ['option-btn'];
    let icon = null;
    if (isHidden) classNames.push('lifeline-removed');
    
    if (isAnswered) {
        if (isCorrect) {
            classNames.push('correct', 'animate-pulse');
            icon = <span className="feedback-icon"><FiCheck /></span>;
        } else if (isSelected) {
            classNames.push('incorrect', 'animate-shake');
            icon = <span className="feedback-icon"><FiX /></span>;
        } else {
             classNames.push('disabled');
        }
    } else if (isSelected) {
        classNames.push('selected');
    }

    return (
        <button
            className={classNames.join(' ')}
            onClick={onClick}
            disabled={isAnswered || isHidden}
            aria-hidden={isHidden}
        >
            <div className="option-content">
                {option}
                <hr />
                <span className="hindi-text">{option_hi}</span>
            </div>
            {icon}
        </button>
    );
}

function QuestionComponent({
    question,
    selectedAnswer,
    hiddenOptions,
    onAnswerSelect,
    zoomLevel
}: {
    question: Question;
    selectedAnswer?: string;
    hiddenOptions: string[];
    onAnswerSelect: (answer: string) => void;
    zoomLevel: number;
}) {
    const isAnswered = !!selectedAnswer;

    const optionsContainerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const optionItemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const getFontSize = (baseSize: number) => `${baseSize * zoomLevel}em`;

    return (
        <div className="question-content-wrapper" style={{ fontSize: getFontSize(1) }}>
            <div className="question-text">
              <div dangerouslySetInnerHTML={{ __html: question.question }} />
              <hr />
              <div className="hindi-text" dangerouslySetInnerHTML={{ __html: question.question_hi }} />
            </div>
            <motion.div 
              className="options-grid"
              key={question.id}
              variants={optionsContainerVariants}
              initial="hidden"
              animate="visible"
            >
                {question.options.map((option, index) => (
                    <motion.div key={option} variants={optionItemVariants}>
                        <Option
                            option={option}
                            option_hi={question.options_hi[index]}
                            isSelected={selectedAnswer === option}
                            isCorrect={option === question.correct}
                            isAnswered={isAnswered}
                            isHidden={hiddenOptions.includes(option)}
                            onClick={() => onAnswerSelect(option)}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

function OverallProgressBar({ current, total }: { current: number, total: number }) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div className="overall-progress-bar-container">
      <div className="overall-progress-bar" style={{ width: `${progress}%` }}></div>
    </div>
  );
}

function QuestionInfo({ question, currentIndex, total, isBookmarked, onToggleBookmark }: { question: Question, currentIndex: number, total: number, isBookmarked: boolean, onToggleBookmark: () => void }) {
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

function QuizBottomNav({ onPrevious, onNext, onToggleMarkForReview, isMarked, isFirst, isLast, isAnswered }) {
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

function QuizSection({
    question, questionNumber, totalQuestions, userAnswer, hiddenOptions,
    onAnswerSelect, onNextQuestion, onPreviousQuestion,
    isFiftyFiftyUsed, onUseFiftyFifty, onTimeUp,
    isBookmarked, onToggleBookmark, isMarkedForReview, onToggleMarkForReview,
    zoomLevel, onZoomIn, onZoomOut, onOpenAiModal, onOpenSettings,
    correctCount, wrongCount
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
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="quiz-main-header">
                <button
                    className="quiz-collapsible-trigger"
                    onClick={() => setIsStatsVisible(!isStatsVisible)}
                    aria-expanded={isStatsVisible}
                    aria-controls="quiz-stats-collapsible"
                >
                    <h3 className="quiz-subject-header">{question.classification.subject} <FiHelpCircle /></h3>
                    <FiChevronDown className={`chevron-icon ${isStatsVisible ? 'open' : ''}`} />
                </button>
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
            </div>
            
            <div className="quiz-scrollable-content">
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


// --- Score & Review View Components ---

function DonutChart({ correct, incorrect, unanswered }: { correct: number, incorrect: number, unanswered: number }) {
  const total = correct + incorrect + unanswered;
  if (total === 0) return null;

  const correctPct = (correct / total);
  const incorrectPct = (incorrect / total);
  
  const circumference = 2 * Math.PI * 45;
  const correctStroke = correctPct * circumference;
  const incorrectStroke = incorrectPct * circumference;

  const correctOffset = 0;
  const incorrectOffset = correctStroke;
  
  return (
    <div className="donut-chart-container">
      <svg width="200" height="200" viewBox="0 0 100 100">
        <circle className="donut-bg" cx="50" cy="50" r="45" />
        <circle 
          className="donut-segment correct" 
          cx="50" cy="50" r="45"
          strokeDasharray={`${correctStroke} ${circumference}`}
          strokeDashoffset={-correctOffset}
        />
        <circle 
          className="donut-segment incorrect" 
          cx="50" cy="50" r="45"
          strokeDasharray={`${incorrectStroke} ${circumference}`}
          strokeDashoffset={-incorrectOffset}
        />
      </svg>
      <div className="chart-text">
        <span className="score-percentage">{Math.round(correctPct * 100)}%</span>
        <span className="score-label">Correct</span>
      </div>
    </div>
  );
}

function ScoreSection({ 
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

function NavigationPanel({
  isOpen, onClose, questions, userAnswers, currentQuestionIndex,
  onJumpToQuestion, triggerRef, bookmarked, markedForReview, onSubmitAndReview
}: {
  isOpen: boolean; onClose: () => void; questions: Question[];
  userAnswers: { [key: number]: string }; currentQuestionIndex: number;
  onJumpToQuestion: (index: number) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  bookmarked: number[]; markedForReview: number[]; onSubmitAndReview: () => void;
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

function ReviewSection({
  questions, userAnswers, onBackToScore, bookmarkedQuestions
}: {
  questions: Question[], userAnswers: {[key: number]: string},
  onBackToScore: () => void, bookmarkedQuestions: number[]
}) {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'bookmarked'>('all');
  const [reviewIndex, setReviewIndex] = useState(0);

  const filteredQuestions = React.useMemo(() => {
    const filtered = questions.filter(q => {
      const userAnswer = userAnswers[q.id];
      if (filter === 'all') return true;
      if (filter === 'correct') return userAnswer === q.correct;
      if (filter === 'incorrect') return userAnswer && userAnswer !== q.correct;
      if (filter === 'bookmarked') return bookmarkedQuestions.includes(q.id);
      return false;
    });
    setReviewIndex(0); // Reset index on filter change
    return filtered;
  }, [filter, questions, userAnswers, bookmarkedQuestions]);

  const currentQuestion = filteredQuestions[reviewIndex];

  return (
    <div className="review-section">
      <div className="review-header">
        <h2>Review Answers</h2>
        <button onClick={onBackToScore} className="back-btn">Back to Score</button>
      </div>
       <SegmentedControl
          options={['all', 'correct', 'incorrect', 'bookmarked']}
          selectedOptions={[filter]} // Adapted for multi-select component
          onOptionToggle={(option) => setFilter(option as any)}
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
        <div className="review-navigation quiz-navigation">
          <button onClick={() => setReviewIndex(i => i - 1)} disabled={reviewIndex === 0}>Previous</button>
          <span>{reviewIndex + 1} / {filteredQuestions.length}</span>
          <button onClick={() => setReviewIndex(i => i + 1)} disabled={reviewIndex === filteredQuestions.length - 1}>Next</button>
        </div>
      )}
    </div>
  )
}

function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { 
    isDarkMode, toggleDarkMode,
    areAnimationsEnabled, toggleAnimations,
    isSoundEnabled, toggleSound,
    isHapticEnabled, toggleHaptics,
    areBgAnimationsEnabled, toggleBgAnimations
  } = useContext(SettingsContext);
  
  if (!isOpen) return null;

  return createPortal(
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2><FiSettings /> Settings</h2>
          <button className="settings-close-btn" onClick={onClose} aria-label="Close settings"><FiX/></button>
        </div>
        <SettingsToggle label="Dark Mode" checked={isDarkMode} onChange={toggleDarkMode} />
        <SettingsToggle label="UI Animations" checked={areAnimationsEnabled} onChange={toggleAnimations} />
        <SettingsToggle label="Background Animations" checked={areBgAnimationsEnabled} onChange={toggleBgAnimations} />
        <SettingsToggle label="Sound" checked={isSoundEnabled} onChange={toggleSound} />
        <SettingsToggle label="Haptic Feedback" checked={isHapticEnabled} onChange={toggleHaptics} />
      </div>
    </div>,
    document.getElementById('portal-root')!
  );
}

function AiExplainerModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 2000); // Simulate API call
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalVariants = {
        hidden: { y: "100%" },
        visible: { y: "0%" },
        exit: { y: "100%" }
    };
    
    return createPortal(
        <div className="ai-explainer-modal-overlay" onClick={onClose}>
            <motion.div
                className="ai-explainer-modal"
                onClick={e => e.stopPropagation()}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            >
                <div className="ai-modal-header">
                    <h3>AI Explainer</h3>
                    <button className="ai-modal-close-btn" onClick={onClose} aria-label="Close AI Explainer"><FiX/></button>
                </div>
                {isLoading ? (
                    <div className="ai-loading-spinner"></div>
                ) : (
                    <div>
                        <h4>Feature Under Development</h4>
                        <p>This feature will provide an in-depth, AI-generated explanation of the topic. The full UI is ready, but the backend connection is pending.</p>
                    </div>
                )}
            </motion.div>
        </div>,
        document.getElementById('portal-root')!
    );
}


// --- Root Application Component ---

function App() {
  const { isDarkMode, areAnimationsEnabled, isHapticEnabled, toggleHaptics } = useContext(SettingsContext);
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
  const [selectedFilters, setSelectedFilters] = useState<typeof initialFilters>(initialFilters);

  // State for the active quiz
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<{[key: number]: string[]}>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useLocalStorageState<number[]>('bookmarkedQuestions', []);
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  
  // UI State
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const navTriggerRef = useRef<HTMLButtonElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  
  // Sound effects
  const playCorrectSound = useSound('https://actions.google.com/sounds/v1/positive/success.ogg');
  const playIncorrectSound = useSound('https://actions.google.com/sounds/v1/negative/failure.ogg');

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
  const handleFilterChange = (filterKey: keyof typeof initialFilters, value: string[]) => {
      setSelectedFilters(prevFilters => ({ ...prevFilters, [filterKey]: value }));
  };

  const handleRemoveFilter = (type: keyof typeof initialFilters, valueToRemove: string) => {
    const currentValues = selectedFilters[type];
    const newValues = currentValues.filter(value => value !== valueToRemove);
    handleFilterChange(type, newValues);
  };

  const filteredQuestions = useMemo(() => allQuestions.filter(q => {
    return filterKeys.every(key => {
        const selected = selectedFilters[key as keyof typeof initialFilters];
        if (selected.length === 0) return true;

        const value = getQuestionValue(q, key as keyof typeof initialFilters);

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
    setIsFiftyFiftyUsed(false);
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

  const handleAnswerSelect = (questionId: number, answer: string) => {
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
        setIsFiftyFiftyUsed(false);
    } else {
        handleEndQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(i => i - 1);
        setIsFiftyFiftyUsed(false);
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
    if (isFiftyFiftyUsed || userAnswers[currentQuestion.id]) return;

    const incorrectOptions = currentQuestion.options.filter(opt => opt !== currentQuestion.correct);
    const toHide = incorrectOptions.sort(() => 0.5 - Math.random()).slice(0, 2);

    setHiddenOptions(prev => ({ ...prev, [currentQuestion.id]: toHide }));
    setIsFiftyFiftyUsed(true);
  };
  
  const handleToggleBookmark = (questionId: number) => {
    setBookmarkedQuestions(prev => 
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );
  };

  const handleToggleMarkForReview = (questionId: number) => {
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
  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsFiftyFiftyUsed(!!hiddenOptions[quizQuestions[index]?.id]);
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
        const question = quizQuestions.find(q => q.id === Number(questionId));
        const answer = userAnswers[Number(questionId)];
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
          <p>Loading questions...</p>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>
);