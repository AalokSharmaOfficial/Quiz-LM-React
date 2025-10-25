import React from 'react';
import { FiChevronsRight } from 'react-icons/fi';
import { InitialFilters } from '../../types';

export function Breadcrumbs({ filters }: { filters: InitialFilters }) {
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
