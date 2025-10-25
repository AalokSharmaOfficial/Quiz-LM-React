import { useMemo, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

export const useSound = (url: string) => {
    const { isSoundEnabled } = useContext(SettingsContext);
    const audio = useMemo(() => typeof Audio !== "undefined" ? new Audio(url) : undefined, [url]);
    
    const play = () => {
        if (isSoundEnabled && audio) {
            audio.play().catch(e => console.error("Sound play failed:", e));
        }
    };
    
    return play;
};
