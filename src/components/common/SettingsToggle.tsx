import React from 'react';

export function SettingsToggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <div className="setting-item">
       <label htmlFor={`setting-${label}`}>{label}</label>
       <div className="theme-toggle">
          <label htmlFor={`setting-${label}`} className="theme-toggle-label">
            <input 
              id={`setting-${label}`}
              type="checkbox" 
              checked={checked}
              onChange={onChange}
            />
            <span className="slider"></span>
          </label>
        </div>
    </div>
  );
}
