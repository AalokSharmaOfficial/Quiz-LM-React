import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { FiSettings, FiX } from 'react-icons/fi';
import { SettingsContext } from '../../context/SettingsContext';
import { SettingsToggle } from '../common/SettingsToggle';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { 
    isDarkMode, toggleDarkMode,
    areAnimationsEnabled, toggleAnimations,
    isSoundEnabled, toggleSound,
    isHapticEnabled, toggleHaptics,
    areBgAnimationsEnabled, toggleBgAnimations
  } = useContext(SettingsContext);
  
  if (!isOpen) return null;

  return createPortal(
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2><FiSettings /> Settings</h2>
          <button className="settings-close-btn" onClick={onClose} aria-label="Close settings"><FiX/></button>
        </div>
        <SettingsToggle label="Dark Mode" checked={isDarkMode} onChange={toggleDarkMode} />
        <SettingsToggle label="UI Animations" checked={areAnimationsEnabled} onChange={toggleAnimations} />
        <SettingsToggle label="Background Animations" checked={areBgAnimationsEnabled} onChange={toggleBgAnimations} />
        <SettingsToggle label="Sound" checked={isSoundEnabled} onChange={toggleSound} />
        <SettingsToggle label="Haptic Feedback" checked={isHapticEnabled} onChange={toggleHaptics} />
      </div>
    </div>,
    document.getElementById('portal-root')!
  );
}
