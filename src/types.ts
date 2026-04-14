export type SessionColor = string;

export interface Speaker {
    id: string;
    name: string;
    title: string;
    company: string;
    isModerator?: boolean;
}

export interface Session {
    id: string;
    roomId: string;
    dayId: string;
    name: string;
    description: string;
    startTime: number; // minutes from 08:00
    duration: number; // minutes
    color: SessionColor;
    type?: string;
    speakers?: Speaker[];
    isTransition?: boolean;
}

export interface RoomDaySettings {
    capacity: number;
    setupType: 'Theater' | 'Classroom' | 'Roundtable' | 'U-Shape' | 'Boardroom' | 'Cabaret' | 'Empty';
    isHidden: boolean;
}

export interface Room {
    id: string;
    name: string;
    daySettings: Record<string, RoomDaySettings>; // dayId -> settings
}

export interface Day {
    id: string;
    name: string;
}

export type ViewMode = 'Day 1' | 'Day 2' | 'Split';

export interface AppState {
    days: Day[];
    rooms: Room[]; // Global rooms list
    sessions: Session[];
    viewMode: ViewMode;
    activeDayId: string;
    activeRoomId?: string;
    eventName?: string;
}
