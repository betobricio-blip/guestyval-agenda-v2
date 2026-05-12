import type { Session } from './types';
import { MIN_SESSION_DURATION, DEFAULT_SESSION_DURATION, MODERN_PALETTE } from './constants';

export const findFirstAvailableSlot = (
    roomId: string,
    dayId: string,
    sessions: Session[],
    startHour: number,
    endHour: number
): { startTime: number; duration: number } | null => {
    const roomSessions = sessions
        .filter((s) => s.roomId === roomId && s.dayId === dayId)
        .sort((a, b) => a.startTime - b.startTime);

    let currentTime = 0;
    const totalMinutesVisible = (endHour - startHour) * 60;

    for (const session of roomSessions) {
        const gap = session.startTime - currentTime;
        if (gap >= MIN_SESSION_DURATION) {
            return {
                startTime: currentTime,
                duration: Math.min(gap, DEFAULT_SESSION_DURATION),
            };
        }
        currentTime = session.startTime + session.duration;
    }

    // Check end of day
    const remainingGap = totalMinutesVisible - currentTime;
    if (remainingGap >= MIN_SESSION_DURATION) {
        return {
            startTime: currentTime,
            duration: Math.min(remainingGap, DEFAULT_SESSION_DURATION),
        };
    }

    return null;
};

export const isColliding = (
    startTime: number,
    duration: number,
    roomId: string,
    dayId: string,
    sessions: Session[],
    excludeSessionId?: string
): boolean => {
    const roomSessions = sessions.filter(
        (s) => s.roomId === roomId && s.dayId === dayId && s.id !== excludeSessionId
    );

    const endTime = startTime + duration;

    return roomSessions.some((s) => {
        const sEnd = s.startTime + s.duration;
        // Overlap condition: start < otherEnd && end > otherStart
        return startTime < sEnd && endTime > s.startTime;
    });
};

export const getSessionTextColor = (bgColor: string): string => {
    if (!bgColor || typeof bgColor !== 'string') return '#1e293b';
    const paletteMatch = MODERN_PALETTE.find(p => p.bg.toLowerCase() === bgColor.toLowerCase());
    if (paletteMatch) return paletteMatch.text;
    
    // Fallback to standard contrast if color is custom
    if (!bgColor || bgColor.length < 6) return '#1e293b';
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 150) ? '#1e293b' : '#f8fafc';
};

export const getContrastText = (hexcolor: string): string => {
    return getSessionTextColor(hexcolor);
};
