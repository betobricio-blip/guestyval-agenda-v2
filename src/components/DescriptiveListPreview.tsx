import React from 'react';
import type { Session, Room } from '../types';
import { minutesToTime12 } from '../constants';
import { User, Star } from 'lucide-react';

interface DescriptiveListPreviewProps {
    sessions: Session[];
    rooms: Room[];
    dayId: string;
    startHour: number;
    theme: {
        primaryColor: string;
        fontFamily: string;
        headlineColor: string;
        bodyTextColor: string;
        showHeadline: boolean;
    };
    selectedRoom: string;
}

export const DescriptiveListPreview: React.FC<DescriptiveListPreviewProps> = ({
    sessions,
    rooms,
    dayId,
    startHour,
    theme,
    selectedRoom
}) => {
    // Filter rooms based on selection
    const filteredRooms = rooms.filter(r => selectedRoom === 'all' || r.id === selectedRoom);

    // Group sessions by room
    const roomGroups = filteredRooms.map(room => {
        const sessionsInRoom = sessions
            .filter(s => s.dayId === dayId && s.roomId === room.id)
            .sort((a, b) => a.startTime - b.startTime);
        return { room, sessions: sessionsInRoom };
    }).filter(group => group.sessions.length > 0);

    if (roomGroups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 w-full">
                <p className="text-xs font-bold uppercase tracking-widest">No sessions found for this selection</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 w-full" style={{ fontFamily: theme.fontFamily }}>
            {theme.showHeadline && (
                <div className="p-10 pb-6 border-b border-slate-50" style={{ backgroundColor: theme.primaryColor }}>
                    <h2 className="text-white text-3xl font-black uppercase tracking-tighter">Event Schedule</h2>
                    <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.3em] mt-2">
                        {dayId === 'day-1' ? 'First Day' : dayId.replace('day-', 'Day ')}
                    </p>
                </div>
            )}

            <div className="p-0">
                {roomGroups.map(({ room, sessions: roomSessions }) => {
                    const roomDayConfig = room.daySettings ? room.daySettings[dayId] : null;
                    return (
                        <div key={room.id} className="mb-0">
                            {/* Room Header with Day-Specific Settings */}
                             <div className="bg-slate-50/50 px-8 py-4 border-y border-slate-100 first:border-t-0 flex items-center justify-between">
                                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{room.name}</h3>
                                 {roomDayConfig && (
                                     <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                         <span>{roomDayConfig.capacity} PPL</span>
                                         <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                         <span>{roomDayConfig.setupType}</span>
                                     </div>
                                 )}
                             </div>

                        <div className="divide-y divide-slate-100">
                            {roomSessions.map((session) => {
                                // const host = session.speakers?.find(s => s.isModerator);
                                // const panelists = session.speakers?.filter(s => !s.isModerator);

                                return (
                                    <div key={session.id} className="p-10 hover:bg-slate-50/30 transition-colors">
                                        {/* Line 1: Time */}
                                        <div className="text-[11px] font-black mb-2 uppercase tracking-widest" style={{ color: theme.primaryColor }}>
                                            {minutesToTime12(session.startTime, startHour)} - {minutesToTime12(session.startTime + session.duration, startHour)}
                                        </div>

                                        {/* Line 2: Session Title */}
                                        <h4 className="text-2xl font-extrabold leading-tight mb-3 tracking-tight" style={{ color: theme.headlineColor }}>
                                            {session.name}
                                        </h4>
                                        
                                        {/* Line 3: Description */}
                                        {session.description && (
                                            <p className="text-base leading-relaxed mb-6 opacity-70" style={{ color: theme.bodyTextColor }}>
                                                {session.description}
                                            </p>
                                        )}

                                        {/* Line 4: Host & Speakers */}
                                        {session.speakers && session.speakers.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-[11px] font-bold uppercase tracking-tight border-t border-slate-100 pt-6 mt-4">
                                                {[...session.speakers].sort((a, b) => (a.isModerator === b.isModerator ? 0 : a.isModerator ? -1 : 1)).map(s => (
                                                    <span key={s.id} className={`flex items-center gap-2 ${s.isModerator ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {s.isModerator ? <Star size={12} fill="#f59e0b" className="text-amber-500" /> : <User size={12} />}
                                                        <span>
                                                            {s.isModerator && <span className="text-amber-600 mr-1">Host:</span>}
                                                            {s.name}
                                                            {s.company ? <span className="opacity-40 font-medium ml-1">@ {s.company}</span> : ''}
                                                        </span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
