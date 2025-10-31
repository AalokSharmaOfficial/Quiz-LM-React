import { useState, useEffect, useRef } from 'react';

export function useTimer({ duration, onTimeUp, key, isPaused }: { duration: number; onTimeUp: () => void; key: any; isPaused: boolean; }): [number, () => void] {
    const [secondsLeft, setSecondsLeft] = useState(duration);
    const intervalRef = useRef<number | null>(null);

    const resetTimer = () => {
        setSecondsLeft(duration);
    };

    useEffect(() => {
        if (isPaused) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        resetTimer();

        intervalRef.current = window.setInterval(() => {
            setSecondsLeft(prevSeconds => {
                if (prevSeconds <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    onTimeUp();
                    return 0;
                }
                return prevSeconds - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [key, duration, isPaused, onTimeUp]);

    return [secondsLeft, resetTimer];
}
