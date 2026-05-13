export const START_HOUR = 8;
export const END_HOUR = 18;
export const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 600

export const PIXELS_PER_MINUTE = 2; // 2 pixels per minute for better readability
export const GRID_HEADER_HEIGHT = 60; // Standard Stage Header height
export const GRID_GUTTER_TOP = 0; // Removing the gutter for absolute alignment
export const COLUMN_WIDTH = 280;
export const MIN_SESSION_DURATION = 20;
export const DEFAULT_SESSION_DURATION = 30;

export const MODERN_PALETTE = [
    { bg: '#EBF0FF', text: '#2A3B52', name: 'Sky' },
    { bg: '#FFE3E3', text: '#5A2D2D', name: 'Rose' },
    { bg: '#B2E4E3', text: '#1D4444', name: 'Teal' },
    { bg: '#EEFAD0', text: '#4B522D', name: 'Lime' },
    { bg: '#FE8673', text: '#FFFFFF', name: 'Coral' },
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
