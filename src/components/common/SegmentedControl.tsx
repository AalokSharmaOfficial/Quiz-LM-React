import React from 'react';

export function SegmentedControl({ 
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
