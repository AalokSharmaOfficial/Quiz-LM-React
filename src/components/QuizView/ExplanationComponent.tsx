import React from 'react';
import { marked } from 'marked';
import { Explanation } from '../../types';

export function ExplanationComponent({ explanation }: { explanation: Explanation }) {
    const renderSection = (title: string, content: string, icon: string, className: string) => {
        if (!content) return null;
        const htmlContent = marked.parse(content.replace(/✅ |❌ |📝 |💡 /g, ''));
        return (
            <div className={`explanation-section ${className}`}>
                <h4>{icon} {title}</h4>
                <div dangerouslySetInnerHTML={{ __html: htmlContent as string }} />
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
