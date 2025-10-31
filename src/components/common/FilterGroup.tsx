import React from 'react';

export function FilterGroup({ title, icon, children }: { title: string; icon: React.ReactElement; children?: React.ReactNode }) {
  return (
    <fieldset className="filter-group">
      <legend>{icon}{title}</legend>
      <div className="filter-group-content">
        {children}
      </div>
    </fieldset>
  );
}
