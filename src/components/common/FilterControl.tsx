import React from 'react';

export function FilterControl({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="filter-control">
      <label>{label}</label>
      {children}
    </div>
  );
}
