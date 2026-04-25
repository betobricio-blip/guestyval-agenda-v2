export const START_HOUR = 8;
export const END_HOUR = 18;
export const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 600

export const PIXELS_PER_MINUTE = 2; // 120px per hour
export const GRID_HEADER_HEIGHT = 60; // Standard Stage Header height
export const GRID_GUTTER_TOP = 24; // Breathing room below headers
export const COLUMN_WIDTH = 280;
export const MIN_SESSION_DURATION = 20;
export const DEFAULT_SESSION_DURATION = 30;

export const MODERN_PALETTE = [
    { bg: '#D1E2D3', text: '#2D4F32', name: 'Sage' },
    { bg: '#D0D7E1', text: '#2A3B52', name: 'Slate' },
    { bg: '#EAD5D5', text: '#5A2D2D', name: 'Dusty Rose' },
    { bg: '#D9D7E8', text: '#352F5B', name: 'Lavender' },
    { bg: '#E8DFD0', text: '#5E4B2B', name: 'Sand' },
    { bg: '#CCE2E2', text: '#1D4444', name: 'Eucalyptus' },
];

export const timeToMinutes = (timeStr: string, startHour: number = START_HOUR): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours - startHour) * 60 + minutes;
};

export const minutesToTime = (minutes: number, startHour: number = START_HOUR): string => {
    const totalMinutes = minutes + (startHour * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const minutesToTime12 = (minutes: number, startHour: number = START_HOUR): string => {
    const totalMinutes = minutes + (startHour * 60);
    let h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const getSessionHeight = (duration: number): number => {
    return duration * PIXELS_PER_MINUTE;
};

export const getSessionTop = (startTime: number): number => {
    return startTime * PIXELS_PER_MINUTE;
};
