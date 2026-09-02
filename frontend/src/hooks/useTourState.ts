import { useState } from 'react';

const TOUR_STORAGE_KEY = 'infera-onboarding-tour-completed';

export function useTourState() {
    const [isCompleted, setIsCompleted] = useState(
        () => localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
    );

    const completeTour = () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        setIsCompleted(true);
    };

    const resetTour = () => {
        localStorage.removeItem(TOUR_STORAGE_KEY);
        setIsCompleted(false);
    };

    return {
        isCompleted,
        completeTour,
        resetTour,
    };
}