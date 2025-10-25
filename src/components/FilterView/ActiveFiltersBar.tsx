import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InitialFilters } from '../../types';

export function ActiveFiltersBar({
  selectedFilters,
  onRemoveFilter
} : {
  selectedFilters: InitialFilters,
  onRemoveFilter: (type: keyof InitialFilters, value: string) => void;
}) {
  const filters = Object.entries(selectedFilters)
    .flatMap(([type, values]) => 
      (values as string[]).map(value => ({ type: type as keyof InitialFilters, value }))
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
