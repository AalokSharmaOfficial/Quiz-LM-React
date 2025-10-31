import React from 'react';
import { InitialFilters } from '../../types';

export function Breadcrumbs({ filters, onGoHome }: { filters: InitialFilters; onGoHome: () => void; }) {
    const allFilterValues = Object.values(filters).flat();
    
    const getFilterText = () => {
        if (allFilterValues.length === 0) return '';
        return `(${allFilterValues.join(', ')})`;
    }

    return (
        <div className="breadcrumbs">
            <a href="#" onClick={(e) => { e.preventDefault(); onGoHome(); }}>Filters</a>
            {allFilterValues.length > 0 && <span className="applied-filters-text">{getFilterText()}</span>}
        </div>
    );
}
