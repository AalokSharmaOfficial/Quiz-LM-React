import React, { createContext, useEffect } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { SettingsContextType } from '../types';

export const SettingsContext = createContext<SettingsContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  areAnimationsEnabled: true,
  toggleAnimations: () => {},
  isSoundEnabled: true,
  toggleSound: () => {},
  isHapticEnabled: true,
  toggleHaptics: () => {},
  areBgAnimationsEnabled: true,
  toggleBgAnimations: () => {},
});

export const SettingsProvider = ({ children }: { children?: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useLocalStorageState('darkMode', false);
  const [areAnimationsEnabled, setAreAnimationsEnabled] = useLocalStorageState('animationsEnabled', true);
  const [isSoundEnabled, setIsSoundEnabled] = useLocalStorageState('soundEnabled', true);
  const [isHapticEnabled, setIsHapticEnabled] = useLocalStorageState('hapticsEnabled', true);
  const [areBgAnimationsEnabled, setAreBgAnimationsEnabled] = useLocalStorageState('bgAnimationsEnabled', true);

  useEffect(() => {
    document.body.dataset.theme = isDarkMode ? 'dark' : 'light';
    if (areBgAnimationsEnabled) {
      document.body.classList.add('background-animated');
    } else {
      document.body.classList.remove('background-animated');
    }
  }, [isDarkMode, areBgAnimationsEnabled]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleAnimations = () => setAreAnimationsEnabled(prev => !prev);
  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  }
  const toggleHaptics = () => {
    setIsHapticEnabled(prev => !prev);
    if (navigator.vibrate && !isHapticEnabled) {
      navigator.vibrate(50);
    }
  }
  const toggleBgAnimations = () => setAreBgAnimationsEnabled(prev => !prev);

  return (
    <SettingsContext.Provider value={{ 
      isDarkMode, toggleDarkMode,
      areAnimationsEnabled, toggleAnimations,
      isSoundEnabled, toggleSound,
      isHapticEnabled, toggleHaptics,
      areBgAnimationsEnabled, toggleBgAnimations
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
