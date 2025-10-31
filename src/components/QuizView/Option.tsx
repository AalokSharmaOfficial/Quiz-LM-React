import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

export function Option({
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
                <span className="hindi-text">{option_hi}</span>
            </div>
            {icon}
        </button>
    );
}
