import { useMemo } from 'react';
import { Question, InitialFilters, filterKeys, getQuestionValue } from '../types';

export function useFilterCounts({ allQuestions, selectedFilters }: {
  allQuestions: Question[];
  selectedFilters: InitialFilters;
}) {
  return useMemo(() => {
    const allCounts: { [key: string]: { [key: string]: number } } = {};

    for (const keyToCount of filterKeys) {
        const contextualFilters = { ...selectedFilters, [keyToCount]: [] as string[] };
        
        const tempFilteredQuestions = allQuestions.filter(q => {
            return filterKeys.every(key => {
                if (key === keyToCount) return true;

                const selected = contextualFilters[key as keyof InitialFilters];
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
        });

        const counts: { [key: string]: number } = {};
        for (const question of tempFilteredQuestions) {
            const value = getQuestionValue(question, keyToCount as keyof InitialFilters);
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
