import React, { useState, useRef, useEffect } from 'react';

export function MultiSelectDropdown({ 
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
