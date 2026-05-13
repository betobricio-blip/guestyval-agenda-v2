import React, { useState } from 'react';
import { Settings2, EyeOff, Users, Layout } from 'lucide-react';
import type { Room, Session, RoomDaySettings } from '../types';
import { PIXELS_PER_MINUTE, minutesToTime, GRID_HEADER_HEIGHT } from '../constants';

interface RoomColumnProps {
    room: Room;
    dayId: string;
    isActive: boolean;
    onActivate: () => void;
    onHideRoom: (roomId: string) => void;
    onRenameRoom: (roomId: string, newName: string) => void;
    onUpdateSettings: (roomId: string, updates: Partial<RoomDaySettings>) => void;
    onDrawComplete: (startTime: number, duration: number) => void;
    onDragHover?: (mouseY: number) => void;
    sessions: Session[];
    startHour: number;
    endHour: number;
    dragGhostStartTime?: number;
    dragGhostDuration?: number;
    dragGhostIsBlocked?: boolean;
    readOnly?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const SETUP_TYPES = ['Theater', 'Classroom', 'Roundtable', 'U-Shape', 'Boardroom', 'Cabaret', 'Empty'];

export const RoomColumn: React.FC<RoomColumnProps> = ({
    room,
    dayId,
    isActive,
    onActivate,
    onHideRoom,
    onRenameRoom,
    onUpdateSettings,
    onDrawComplete,
    onDragHover,
    sessions,
    startHour,
    endHour,
    dragGhostStartTime,
    dragGhostDuration,
    dragGhostIsBlocked,
    readOnly,
    className,
    children
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(room.name);
    const [showSettings, setShowSettings] = useState(false);
    const [drawingState, setDrawingState] = useState<{ startMins: number; currentMins: number } | null>(null);

    const dayConfig = (room.daySettings && room.daySettings[dayId]) || { capacity: 100, setupType: 'Theater', isHidden: false };

    const getSnappedMins = (y: number) => {
        const mins = y / PIXELS_PER_MINUTE;
        return Math.round(mins / 5) * 5;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (readOnly || e.button !== 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const startMins = getSnappedMins(y);
        const maxMins = (endHour - startHour) * 60;
        if (startMins < 0 || startMins >= maxMins) return;
        const absoluteStartMins = startMins + ((startHour - 8) * 60);
        const isOccupied = sessions.some(s => s.roomId === room.id && s.dayId === dayId && absoluteStartMins >= s.startTime && absoluteStartMins < (s.startTime + s.duration));
        if (isOccupied) return;
        setDrawingState({ startMins, currentMins: startMins });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (onDragHover) onDragHover(e.clientY);
        if (!drawingState) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        let currentMins = getSnappedMins(y);
        const gridOffsetMins = (startHour - 8) * 60;
        const roomSessions = sessions
            .filter(s => s.roomId === room.id && s.dayId === dayId)
            .sort((a, b) => a.startTime - b.startTime);

        if (currentMins > drawingState.startMins) {
            const nextSession = roomSessions.find(s => s.startTime >= (drawingState.startMins + gridOffsetMins));
            if (nextSession) {
                const relativeNextStart = nextSession.startTime - gridOffsetMins;
                currentMins = Math.min(currentMins, relativeNextStart);
            }
            const maxMins = (endHour - startHour) * 60;
            currentMins = Math.min(currentMins, maxMins);
        } else if (currentMins < drawingState.startMins) {
            const prevSession = [...roomSessions].reverse().find(s => (s.startTime + s.duration) <= (drawingState.startMins + gridOffsetMins));
            if (prevSession) {
                const relativePrevEnd = (prevSession.startTime + prevSession.duration) - gridOffsetMins;
                currentMins = Math.max(currentMins, relativePrevEnd);
            }
            currentMins = Math.max(currentMins, 0);
        }
        setDrawingState({ ...drawingState, currentMins });
    };

    const handleMouseUp = () => {
        if (!drawingState) return;
        const start = Math.min(drawingState.startMins, drawingState.currentMins);
        let duration = Math.abs(drawingState.currentMins - drawingState.startMins);
        if (duration < 5) duration = 15;
        onDrawComplete(start + ((startHour - 8) * 60), duration);
        setDrawingState(null);
    };

    const gridHeight = (endHour - startHour) * 60 * PIXELS_PER_MINUTE;

    return (
        <div
            onClick={onActivate}
            className={`min-w-[280px] flex-1 flex flex-col border-r last:border-r-0 bg-white relative hover:z-[200] transition-all ${isActive ? 'ring-2 ring-slate-950 ring-inset z-[150]' : 'z-0'} ${className || ''}`}
            style={{ minHeight: `${gridHeight + GRID_HEADER_HEIGHT}px` }}
        >
            {/* Room Header */}
            <div 
                className={`flex items-center justify-between px-4 sticky top-0 z-[100] border-b transition-all duration-300 ${isActive ? 'bg-slate-950 border-slate-950' : 'bg-slate-50 border-slate-200'}`}
                style={{ height: `${GRID_HEADER_HEIGHT}px` }}
            >
                <div className="flex-1 min-w-0 mr-2">
                    {isRenaming && !readOnly ? (
                        <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => { setIsRenaming(false); onRenameRoom(room.id, newName); }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                            className="bg-white border text-sm font-black px-2 py-1 rounded-lg outline-none w-full shadow-sm"
                        />
                    ) : (
                        <div className="flex flex-col">
                            <h3 className={`text-[12px] font-black truncate uppercase tracking-[0.1em] ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                {room.name}
                            </h3>
                            <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 mt-0.5 ${isActive ? 'text-white/50' : 'text-slate-400/80'}`}>
                                <span>{dayConfig.capacity} PPL</span>
                                <span className="w-1 h-1 rounded-full bg-current opacity-20"></span>
                                <span>{dayConfig.setupType}</span>
                            </div>
                        </div>
                    )}
                </div>

                {!readOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} 
                            className={`p-1.5 rounded-xl transition-all ${isActive ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            title="Room Day Settings"
                        >
                            <Settings2 size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onHideRoom(room.id); }} 
                            className={`p-1.5 rounded-xl transition-all ${isActive ? 'text-slate-400 hover:text-amber-500 hover:bg-white/10' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                            title="Hide for this Day"
                        >
                            <EyeOff size={16} />
                        </button>
                    </div>
                )}

                {showSettings && (
                    <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-[200] animate-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                            <Layout size={10} /> Room Configuration
                        </h4>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 block ml-1 uppercase">Room Identity (Global)</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={newName} 
                                        onChange={e => setNewName(e.target.value)}
                                        onBlur={() => onRenameRoom(room.id, newName)}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 block ml-1 uppercase">Capacity</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={dayConfig.capacity} 
                                            onChange={e => onUpdateSettings(room.id, { capacity: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 pl-7 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                        <Users size={12} className="absolute left-2 top-2.5 text-slate-300" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 block ml-1 uppercase">Setup</label>
                                    <select 
                                        value={dayConfig.setupType}
                                        onChange={e => onUpdateSettings(room.id, { setupType: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    >
                                        {SETUP_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="w-full py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all">Close</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid Area */}
            <div
                className="relative time-heartbeat-grid bg-white cursor-crosshair select-none"
                style={{ 
                    height: `${gridHeight}px`
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {children}

                {drawingState && (
                    <div
                        className="absolute left-0 right-0 bg-emerald-500/10 border-2 border-emerald-500/40 z-30 pointer-events-none flex items-center justify-center"
                        style={{
                            top: `${Math.min(drawingState.startMins, drawingState.currentMins) * PIXELS_PER_MINUTE}px`,
                            height: `${Math.max(15, Math.abs(drawingState.currentMins - drawingState.startMins)) * PIXELS_PER_MINUTE}px`
                        }}
                    >
                        <span className="text-[10px] font-bold text-emerald-700 bg-white/90 px-1.5 py-0.5 rounded shadow-sm border border-emerald-200">
                            {minutesToTime(Math.min(drawingState.startMins, drawingState.currentMins), startHour)} • {Math.max(15, Math.abs(drawingState.currentMins - drawingState.startMins))}m
                        </span>
                    </div>
                )}

                {dragGhostStartTime !== undefined && (
                    <div
                        className={`absolute left-1 right-1 border-2 border-dashed z-30 pointer-events-none rounded-sm bg-white/40 ${dragGhostIsBlocked ? 'border-red-500 bg-red-50/30' : 'border-emerald-500 bg-emerald-50/20'}`}
                        style={{
                            top: `${(dragGhostStartTime - ((startHour - 8) * 60)) * PIXELS_PER_MINUTE}px`,
                            height: `${(dragGhostDuration || 30) * PIXELS_PER_MINUTE}px`,
                        }}
                    >
                        <div className={`absolute top-0 right-0 px-1.5 py-0.5 text-[9px] font-bold text-white rounded-bl ${dragGhostIsBlocked ? 'bg-red-500' : 'bg-emerald-500'}`}>
                            {dragGhostIsBlocked ? 'Blocked' : 'Release to Move'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
