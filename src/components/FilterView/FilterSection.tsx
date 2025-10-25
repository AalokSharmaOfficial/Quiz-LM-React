import React from 'react';
import { FiArchive, FiSettings, FiTag } from 'react-icons/fi';
import { FaSitemap } from 'react-icons/fa';
import { FilterGroup } from '../common/FilterGroup';
import { FilterControl } from '../common/FilterControl';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';
import { SegmentedControl } from '../common/SegmentedControl';
import { QuickStartButtons } from './QuickStartButtons';
import { ActiveFiltersBar } from './ActiveFiltersBar';
import { InitialFilters } from '../../types';
import { FiRefreshCw } from 'react-icons/fi';

export function FilterSection({ 
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
  selectedFilters: InitialFilters;
  onFilterChange: (filterKey: keyof InitialFilters, value: string[]) => void;
  filteredQuestionCount: number;
  onStartQuiz: () => void;
  onQuickStart: (params: { difficulty?: string, count: number }) => void;
  onRemoveFilter: (type: keyof InitialFilters, value: string) => void;
  onResetFilters: () => void;
  filterCounts: { [key: string]: { [key: string]: number } };
}) {
  const handleToggleFilterValue = (type: keyof InitialFilters, valueToToggle: string) => {
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
