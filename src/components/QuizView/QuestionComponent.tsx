import React from 'react';
import { motion } from 'framer-motion';
import { Question } from '../../types';
import { Option } from './Option';

export function QuestionComponent({
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
