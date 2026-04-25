import { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { TopNav } from './components/TopNav'
import { RoomColumn } from './components/RoomColumn'
import { TimeAxis } from './components/TimeAxis'
import { SessionCell } from './components/SessionCell'
import { SessionModal } from './components/SessionModal'
import { PersistenceModal } from './components/PersistenceModal'
import { LoginOverlay } from './components/LoginOverlay'
import { ExporterView } from './components/ExporterView'
import type { Day, Room, Session, ViewMode, RoomDaySettings } from './types'
import { findFirstAvailableSlot, isColliding } from './utils'
import { PIXELS_PER_MINUTE, MIN_SESSION_DURATION, GRID_HEADER_HEIGHT, MODERN_PALETTE } from './constants'
import { Settings, Plus, X, Eye, EyeOff, Layout } from 'lucide-react'

// Core Constants
const START_HOUR = 8;
const END_HOUR = 18;
const STORAGE_KEY = 'guestyval_agenda_builder_v4';
const AUTH_KEY = 'guestyval_auth_session';
const MASTER_PASSWORD = 'GuestyVal2026';

interface DaySettings {
  startHour: number;
  endHour: number;
}

const INITIAL_DAY_SETTINGS = (isHidden: boolean = false): RoomDaySettings => ({
  capacity: 100,
  setupType: 'Theater',
  isHidden
});

const INITIAL_DAYS: Day[] = [
  { id: 'day-1', name: 'Day 1' },
  { id: 'day-2', name: 'Day 2' },
];

const INITIAL_ROOMS: Room[] = [
  { 
    id: 'r1', 
    name: 'Main Stage', 
    daySettings: { 'day-1': INITIAL_DAY_SETTINGS(), 'day-2': INITIAL_DAY_SETTINGS() } 
  },
  { 
    id: 'r2', 
    name: 'Masterclasses', 
    daySettings: { 'day-1': INITIAL_DAY_SETTINGS(), 'day-2': INITIAL_DAY_SETTINGS() } 
  },
  { 
    id: 'r3', 
    name: 'Workshops', 
    daySettings: { 'day-1': INITIAL_DAY_SETTINGS(), 'day-2': INITIAL_DAY_SETTINGS() } 
  },
];

const COLORS = MODERN_PALETTE.map(p => p.bg);

// Helper Popover Component
const RangeSettingsPopover = ({ current, onApply, onClose }: { current: DaySettings, onApply: (up: Partial<DaySettings>) => void, onClose: () => void }) => {
  const [start, setStart] = useState(current.startHour);
  const [end, setEnd] = useState(current.endHour);

  return (
    <div className="absolute top-10 left-2 w-56 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
        <Settings size={12} />
        Grid Bounds
      </h4>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[9px] font-bold text-slate-400 block mb-1">Start Hour</label>
            <input type="number" step="0.5" value={start} onChange={e => setStart(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-bold text-slate-400 block mb-1">End Hour</label>
            <input type="number" step="0.5" value={end} onChange={e => setEnd(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase">Cancel</button>
          <button onClick={() => { onApply({ startHour: start, endHour: end }); onClose(); }} className="flex-grow px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all uppercase">Apply Range</button>
        </div>
      </div>
    </div>
  );
};

// Manage Rooms Popover Component
const ManageRoomsPopover = ({ 
  rooms, 
  dayId, 
  onToggleVisibility, 
  onClose 
}: { 
  rooms: Room[], 
  dayId: string, 
  onToggleVisibility: (roomId: string) => void, 
  onClose: () => void 
}) => {
  return (
    <div className="absolute top-10 right-0 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden z-[200] animate-in fade-in zoom-in-95 duration-200">
      <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Layout size={12} />
          Manage Rooms
        </h4>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
        {rooms.map(room => {
          const isHidden = room.daySettings[dayId]?.isHidden;
          return (
            <div key={room.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors group">
              <span className={`text-xs font-bold truncate pr-4 ${isHidden ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                {room.name}
              </span>
              <button 
                onClick={() => onToggleVisibility(room.id)}
                className={`p-1.5 rounded-lg transition-all ${isHidden ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 shadow-sm'}`}
                title={isHidden ? "Show Room" : "Hide Room"}
              >
                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          );
        })}
        {rooms.length === 0 && (
          <div className="py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            No rooms found
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  const [viewMode, setViewMode] = useState<ViewMode>('Day 1');
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(INITIAL_ROOMS[0].id);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [persistenceMode, setPersistenceMode] = useState<'save' | 'open' | null>(null);
  const [showExporter, setShowExporter] = useState(false);
  const [daySettings, setDaySettings] = useState<Record<string, DaySettings>>({
    'day-1': { startHour: START_HOUR, endHour: END_HOUR },
    'day-2': { startHour: START_HOUR, endHour: END_HOUR },
  });
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [showManageRooms, setShowManageRooms] = useState<string | null>(null);
  const [activeSaveName, setActiveSaveName] = useState<string | null>(null);

  const [eventName, setEventName] = useState<string>('GuestyVal 2026');
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);

  const [dragState, setDragState] = useState<{
    sessionId: string;
    initialMouseY: number;
    initialStartTime: number;
    initialRoomId: string;
    initialDayId: string;
  } | null>(null);

  const [dragGhost, setDragGhost] = useState<{
    roomId: string;
    dayId: string;
    startTime: number;
    isOverlapping?: boolean;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        let finalRooms: Room[] = [];
        
        // MIGRATION: Record<string, Room[]> -> Room[]
        if (config.rooms) {
          if (!Array.isArray(config.rooms)) {
            const oldRooms: Record<string, Room[]> = config.rooms;
            const newRoomsMap: Record<string, Room> = {};
            
            Object.entries(oldRooms).forEach(([dayId, dayRooms]) => {
              dayRooms.forEach(or => {
                if (newRoomsMap[or.id]) {
                   newRoomsMap[or.id].daySettings[dayId] = (or as any).daySettings?.[dayId] || INITIAL_DAY_SETTINGS();
                } else {
                   newRoomsMap[or.id] = {
                     id: or.id,
                     name: or.name,
                     daySettings: { [dayId]: (or as any).daySettings?.[dayId] || INITIAL_DAY_SETTINGS() }
                   };
                }
              });
            });
            finalRooms = Object.values(newRoomsMap);
          } else {
            finalRooms = config.rooms;
          }
          setRooms(finalRooms);
        } else {
          finalRooms = INITIAL_ROOMS;
        }

        if (config.sessions) {
          // MIGRATION: Fix ghost sessions with invalid roomIds
          const sessionsWithFixedIds = config.sessions.map((s: Session) => {
            const roomExists = finalRooms.some(r => r.id === s.roomId);
            if (!roomExists) {
              // Try to find the room name from the old data if possible
              // config.rooms (old version) might have the room with this ID
              let oldRoomName = '';
              if (config.rooms && !Array.isArray(config.rooms)) {
                // Search in Record<string, Room[]>
                Object.values(config.rooms).flat().forEach((r: any) => {
                  if (r.id === s.roomId) oldRoomName = r.name;
                });
              } else if (config.rooms && Array.isArray(config.rooms)) {
                const oldRoom = config.rooms.find((r: Room) => r.id === s.roomId);
                if (oldRoom) oldRoomName = oldRoom.name;
              }

              if (oldRoomName) {
                const matchingRoom = finalRooms.find(r => r.name === oldRoomName);
                if (matchingRoom) {
                  return { ...s, roomId: matchingRoom.id, description: s.description || '' };
                }
              }
            }
            return {
              ...s,
              description: s.description || ''
            };
          });
          setSessions(sessionsWithFixedIds);
        }
        if (config.daySettings) setDaySettings(config.daySettings);
        if (config.viewMode) setViewMode(config.viewMode);
        if (config.eventName) setEventName(config.eventName);
      } catch (e) {
        console.error('Storage sync failed', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const state = { rooms, sessions, daySettings, viewMode, eventName };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [rooms, sessions, daySettings, viewMode, isAuthenticated]);

  const handleLogin = (password: string) => {
    if (password === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      toast.success('Access Granted');
      return true;
    }
    return false;
  };

  const activeDayId = viewMode === 'Day 2' ? 'day-2' : 'day-1';
  const activeDayName = INITIAL_DAYS.find(d => d.id === activeDayId)?.name || '';

  const handleToggleRoomVisibility = (roomId: string, dayId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const current = r.daySettings[dayId] || INITIAL_DAY_SETTINGS();
      return {
        ...r,
        daySettings: {
          ...r.daySettings,
          [dayId]: { ...current, isHidden: !current.isHidden }
        }
      };
    }));
    toast.success('Room visibility updated');
  };

  const handleUpdateRoomDaySettings = (roomId: string, dayId: string, updates: Partial<RoomDaySettings>) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const current = r.daySettings[dayId] || INITIAL_DAY_SETTINGS();
      return {
        ...r,
        daySettings: {
          ...r.daySettings,
          [dayId]: { ...current, ...updates }
        }
      };
    }));
  };

  const handleRenameRoom = (roomId: string, newName: string) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, name: newName } : r));
    toast.success('Room renamed globally');
  };

  const handleUpdateDaySettings = (dayId: string, updates: Partial<DaySettings>) => {
    if (updates.startHour !== undefined) {
      const currentStartHour = daySettings[dayId].startHour;
      if (updates.startHour > currentStartHour) {
        const daySessions = sessions.filter(s => s.dayId === dayId);
        const hasConflicts = daySessions.some(s => (currentStartHour * 60 + s.startTime) < (updates.startHour * 60));
        if (hasConflicts) {
          toast.error(`Cannot adjust grid: A session currently exists which falls outside the new boundaries. Please move or delete the session first.`);
          return;
        }
      }
    }
    if (updates.endHour !== undefined) {
      const currentEndHour = daySettings[dayId].endHour;
      if (updates.endHour < currentEndHour) {
        const currentStartHour = daySettings[dayId].startHour;
        const daySessions = sessions.filter(s => s.dayId === dayId);
        const hasConflicts = daySessions.some(s => (currentStartHour * 60 + s.startTime + s.duration) > (updates.endHour * 60));
        if (hasConflicts) {
          toast.error(`Cannot adjust grid: A session currently exists which falls outside the new boundaries. Please move or delete the session first.`);
          return;
        }
      }
    }
    setDaySettings(prev => ({ ...prev, [dayId]: { ...prev[dayId], ...updates } }));
  };

  const handleAddRoom = (dayId: string) => {
    const name = window.prompt("Enter new Room Name:", "Workshop Room");
    if (!name) return;

    const newRoom: Room = {
      id: `r${Math.random().toString(36).substring(2, 9)}`,
      name: name,
      daySettings: {
        'day-1': INITIAL_DAY_SETTINGS(false),
        'day-2': INITIAL_DAY_SETTINGS(false)
      }
    };
    setRooms(prev => [...prev, newRoom]);
    setActiveRoomId(newRoom.id);
    toast.success(`Room "${name}" added`);
  };

  const handleAddSession = () => {
    if (!activeRoomId) return;
    let roomDayId = activeDayId;
    const settings = daySettings[roomDayId];
    const slot = findFirstAvailableSlot(activeRoomId, roomDayId, sessions, settings.startHour, settings.endHour);
    if (!slot) return;

    const newSession: Session = {
      id: `s${Math.random().toString(36).substring(2, 9)}`,
      dayId: roomDayId,
      roomId: activeRoomId,
      name: 'New Session',
      description: '',
      startTime: slot.startTime,
      duration: Math.max(MIN_SESSION_DURATION, slot.duration),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    setSessions(prev => [...prev, newSession]);
    setEditingSession(newSession);
  };

  const handleUpdateSession = (sessionId: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const updated = { ...s, ...updates };
      if (updated.duration < MIN_SESSION_DURATION) updated.duration = MIN_SESSION_DURATION;
      updated.startTime = Math.round(updated.startTime / 5) * 5;
      
      const isTimeChange = updates.startTime !== undefined || updates.duration !== undefined || updates.roomId !== undefined;
      if (isTimeChange && isColliding(updated.startTime, updated.duration, updated.roomId, updated.dayId, prev, sessionId)) {
          toast.error("Blocked by collision");
          return s;
      }
      return updated;
    }));
  };

  const handleDrawComplete = (dayId: string, roomId: string, startTime: number, duration: number) => {
    const finalDuration = Math.max(MIN_SESSION_DURATION, duration);
    const newSession: Session = {
      id: `s${Math.random().toString(36).substring(2, 9)}`,
      roomId,
      dayId,
      name: 'New Session',
      description: '',
      startTime,
      duration: finalDuration,
      color: COLORS[0], // Default to first elegant color
    };
    setSessions(prev => [...prev, newSession]);
    setEditingSession(newSession);
  };

  const initiateDrag = useCallback((sessionId: string, mouseEvent: React.MouseEvent) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    setDragState({
      sessionId,
      initialMouseY: mouseEvent.clientY,
      initialStartTime: session.startTime,
      initialRoomId: session.roomId,
      initialDayId: session.dayId,
    });
    setDragGhost({
      roomId: session.roomId,
      dayId: session.dayId,
      startTime: session.startTime,
    });
  }, [sessions]);

  const handleDragMove = useCallback((roomId: string, dayId: string, mouseY: number) => {
    if (!dragState) return;
    const session = sessions.find(s => s.id === dragState.sessionId);
    if (!session) return;

    const deltaY = mouseY - dragState.initialMouseY;
    const deltaMins = Math.round((deltaY / PIXELS_PER_MINUTE) / 5) * 5;
    
    let newStartTime = dragState.initialStartTime + deltaMins;
    const settings = daySettings[dayId];
    const maxVisibleMins = (settings.endHour - settings.startHour) * 60;
    newStartTime = Math.max(0, Math.min(maxVisibleMins - session.duration, newStartTime));

    const overlaps = isColliding(newStartTime, session.duration, roomId, dayId, sessions, session.id);
    
    setDragGhost({
      roomId,
      dayId,
      startTime: newStartTime,
      isOverlapping: overlaps
    });
  }, [dragState, sessions, daySettings]);

  const handleDragRelease = useCallback(() => {
    if (!dragState || !dragGhost) {
      setDragState(null);
      setDragGhost(null);
      return;
    }

    const session = sessions.find(s => s.id === dragState.sessionId);
    if (!session) {
      setDragState(null);
      setDragGhost(null);
      return;
    }

    const finalCollision = isColliding(dragGhost.startTime, session.duration, dragGhost.roomId, dragGhost.dayId, sessions, session.id);
    
    if (finalCollision) {
      toast.error('Blocked: Invalid drop destination');
    } else {
      setSessions(prev => prev.map(s => s.id === session.id 
        ? { ...s, startTime: dragGhost.startTime, roomId: dragGhost.roomId, dayId: dragGhost.dayId } 
        : s
      ));
      toast.success('Session moved');
    }

    setDragState(null);
    setDragGhost(null);
  }, [dragState, dragGhost, sessions]);

  useEffect(() => {
    if (dragState) {
      const globalUp = () => handleDragRelease();
      window.addEventListener('mouseup', globalUp);
      return () => window.removeEventListener('mouseup', globalUp);
    }
  }, [dragState, handleDragRelease]);

  const renderDayLayout = (dayId: string) => {
    const visibleRooms = rooms.filter(r => !r.daySettings[dayId]?.isHidden);
    const settings = daySettings[dayId];
    return (
      <div className="flex flex-1 overflow-x-auto overflow-y-auto relative print:overflow-visible print:w-full print:block bg-white pb-32 no-scrollbar">
        {/* Sticky Sidebar (Settings + Time Axis) */}
        <div className="sticky left-0 top-0 z-[110] flex flex-col shrink-0 no-print border-r bg-slate-50 border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
            {/* Settings Gear - Absolute so it doesn't push the axis coordinate system */}
            <div className="absolute top-0 left-0 w-full flex items-center justify-center bg-white border-b border-slate-200 z-[120]" style={{ height: `${GRID_HEADER_HEIGHT}px` }}>
                <button 
                    onClick={() => setShowSettings(showSettings === dayId ? null : dayId)} 
                    className="h-9 w-9 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95 shadow-sm"
                    title="Grid Range Settings"
                >
                    <Settings size={18} />
                </button>
                {showSettings === dayId && (
                    <RangeSettingsPopover 
                        current={settings} 
                        onApply={(updates) => handleUpdateDaySettings(dayId, updates)} 
                        onClose={() => setShowSettings(null)} 
                    />
                )}
            </div>
            
            <TimeAxis startHour={settings.startHour} endHour={settings.endHour} />
        </div>

        {/* Room Columns */}
        {visibleRooms.map((room, roomIdx) => (
          <RoomColumn
            key={room.id}
            room={room}
            dayId={dayId}
            isActive={activeRoomId === room.id}
            onActivate={() => setActiveRoomId(room.id)}
            onHideRoom={(id) => handleToggleRoomVisibility(id, dayId)}
            onRenameRoom={(id, name) => handleRenameRoom(id, name)}
            onUpdateSettings={(id, up) => handleUpdateRoomDaySettings(id, dayId, up)}
            onDrawComplete={(start, dur) => handleDrawComplete(dayId, room.id, start, dur)}
            onDragHover={(y) => handleDragMove(room.id, dayId, y)}
            sessions={sessions}
            startHour={settings.startHour}
            endHour={settings.endHour}
            dragGhostStartTime={dragGhost?.roomId === room.id && dragGhost?.dayId === dayId ? dragGhost.startTime : undefined}
            dragGhostDuration={dragState ? sessions.find(s => s.id === dragState.sessionId)?.duration : undefined}
            dragGhostIsBlocked={dragGhost?.roomId === room.id && dragGhost?.dayId === dayId ? dragGhost.isOverlapping : undefined}
          >
            {sessions.filter(s => s.roomId === room.id && s.dayId === dayId).map(s => (
                <SessionCell 
                  key={s.id} 
                  session={s} 
                  onClick={() => !dragState && setEditingSession(s)} 
                  onInitiateDrag={(e) => initiateDrag(s.id, e)}
                  startHour={settings.startHour} 
                  isDimmed={dragState?.sessionId === s.id}
                  suppressHover={!!editingSession || !!persistenceMode || showExporter || showGlobalSettings}
                  tooltipPosition={roomIdx === visibleRooms.length - 1 ? 'left' : 'right'}
                />
            ))}
          </RoomColumn>
        ))}

        {/* Slim Add Room Bar */}
        <div className="min-w-[56px] w-[56px] flex flex-col border-r border-slate-200 bg-slate-50/30 group no-print hover:bg-emerald-50/30 transition-colors">
            <div className="h-[60px] border-b flex flex-col items-center justify-center sticky top-0 bg-white border-slate-200 z-[100] group-hover:bg-emerald-50/50 transition-colors gap-1">
                <div className="relative">
                    <button 
                        onClick={() => setShowManageRooms(showManageRooms === dayId ? null : dayId)}
                        className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center shadow-sm active:scale-90 ${showManageRooms === dayId ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200'}`}
                        title="Manage Existing Rooms"
                    >
                        <Layout size={14} />
                    </button>
                    {showManageRooms === dayId && (
                      <ManageRoomsPopover 
                        rooms={rooms} 
                        dayId={dayId} 
                        onToggleVisibility={(id) => handleToggleRoomVisibility(id, dayId)} 
                        onClose={() => setShowManageRooms(null)} 
                      />
                    )}
                </div>
                <button 
                    onClick={() => handleAddRoom(dayId)}
                    className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 group-hover:bg-white transition-all flex items-center justify-center shadow-sm active:scale-90"
                    title="Add New Room Column"
                >
                    <Plus size={16} />
                </button>
            </div>
            <div className="flex-1 opacity-10 group-hover:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
        </div>
      </div>
    );
  };

  const handleSaveApp = (name: string) => {
      const state = { rooms, sessions, daySettings, name, timestamp: Date.now() };
      const saved = JSON.parse(localStorage.getItem('guestyval_saved') || '[]');
      const updated = [...saved.filter((s:any) => s.name !== name), state];
      localStorage.setItem('guestyval_saved', JSON.stringify(updated));
      setActiveSaveName(name);
      setPersistenceMode(null);
      toast.success(`Saved "${name}"`);
  };

  const handleExport = () => {
    const data = {
        current: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
        saved: JSON.parse(localStorage.getItem('guestyval_saved') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Agenda_Data.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Agenda data exported');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            
            // Handle both wrapped and direct state formats
            const currentState = data.current || (data.rooms ? data : null);
            const savedConfigurations = data.saved || (Array.isArray(data) ? data : []);

            if (currentState) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
            }
            if (savedConfigurations.length > 0) {
                localStorage.setItem('guestyval_saved', JSON.stringify(savedConfigurations));
            }

            toast.success('Data imported. Reloading builder...');
            setTimeout(() => window.location.reload(), 1200);
        } catch (error) {
            toast.error('Failed to import: Invalid file format');
        }
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
        <div className="h-screen bg-[#0d4741]">
            <Toaster position="bottom-right" />
            <LoginOverlay onLogin={handleLogin} />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Toaster position="bottom-right" />
      <TopNav 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        onAddSession={handleAddSession} 
        onSave={() => activeSaveName ? handleSaveApp(activeSaveName) : setPersistenceMode('save')} 
        onSaveAs={() => setPersistenceMode('save')} 
        onOpen={() => setPersistenceMode('open')} 
        onPrint={() => window.print()} 
        onExport={handleExport}
        onImport={handleImport}
        onPublish={() => setShowExporter(true)}
        eventName={eventName}
        onOpenGlobalSettings={() => setShowGlobalSettings(true)}
        activeDayName={activeDayName} 
        activeSaveName={activeSaveName} 
      />
      <main className="flex-1 overflow-hidden flex flex-col print:overflow-visible bg-white">
          {viewMode === 'Split' ? (
            <div className="flex flex-1 overflow-hidden divide-x-4 divide-slate-200 bg-white">
                <div className="flex-1 flex flex-col overflow-hidden">{renderDayLayout('day-1')}</div>
                <div className="flex-1 flex flex-col overflow-hidden">{renderDayLayout('day-2')}</div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {renderDayLayout(activeDayId)}
            </div>
          )}
      </main>
      {editingSession && (
        <SessionModal 
          session={editingSession} 
          onClose={() => setEditingSession(null)} 
          onUpdate={updates => handleUpdateSession(editingSession.id, updates)} 
          onDelete={id => { setSessions(prev => prev.filter(s => s.id !== id)); setEditingSession(null); toast.success('Session deleted'); }} 
          sessions={sessions} 
          startHour={daySettings[editingSession.dayId]?.startHour || START_HOUR} 
          endHour={daySettings[editingSession.dayId]?.endHour || END_HOUR} 
        />
      )}
      {persistenceMode && <PersistenceModal mode={persistenceMode} onClose={() => setPersistenceMode(null)} onSave={handleSaveApp} onSelect={c => { setRooms(c.rooms); setSessions(c.sessions); setDaySettings(c.daySettings); setActiveSaveName(c.name); if(c.eventName) setEventName(c.eventName); setPersistenceMode(null);}} />}
      {showExporter && <ExporterView rooms={rooms} sessions={sessions} eventName={eventName} onClose={() => setShowExporter(false)} daySettings={daySettings} />}
      
      {/* Global Settings Modal */}
      {showGlobalSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowGlobalSettings(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} />
                Global Settings
              </h2>
              <button onClick={() => setShowGlobalSettings(false)} className="p-1 rounded-full hover:bg-slate-200 text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Event Name</label>
                <input
                  autoFocus
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800"
                  placeholder="e.g. My Awesome Event 2026"
                />
              </div>
              <button
                onClick={() => setShowGlobalSettings(false)}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all uppercase"
              >
                Close & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
