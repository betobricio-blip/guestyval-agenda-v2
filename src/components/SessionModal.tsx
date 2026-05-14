import React, { useState, useEffect } from 'react';
import type { Session, Speaker } from '../types';
import { 
    X, Trash2, ChevronDown, Plus, User, Mic, ChevronUp, 
    ChevronDown as ChevronDownIcon, Star, Coffee, Users, Wrench, MoveUp, MoveDown 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MODERN_PALETTE, minutesToTime, timeToMinutes } from '../constants';
import { getContrastText } from '../utils';

const COLORS = MODERN_PALETTE.map(p => p.bg);

const PRESETS: Record<string, { icon: any, color: string, label: string }> = {
  'Keynote': { icon: Mic, color: '#D9D7E8', label: 'Keynote' },
  'Panel': { icon: Users, color: '#D0D7E1', label: 'Panel' },
  'Break': { icon: Coffee, color: '#E8DFD0', label: 'Break' },
  'Workshop': { icon: Wrench, color: '#D1E2D3', label: 'Workshop' },
  'TPM Roundtables': { icon: Users, color: '#CCE2E2', label: 'Roundtable' },
  'Tech Talks': { icon: Star, color: '#E9E2D5', label: 'Tech Talk' },
  'Other': { icon: User, color: '#CCE2E2', label: 'Session' }
};

interface SessionModalProps {
    session: Session;
    onClose: () => void;
    onUpdate: (updates: Partial<Session>) => void;
    onDelete: (sessionId: string) => void;
    sessions: Session[];
    startHour: number;
    endHour: number;
}

// Using imported time utilities

export const SessionModal: React.FC<SessionModalProps> = ({
    session,
    onClose,
    onUpdate,
    onDelete,
    sessions,
    startHour,
    endHour
}) => {
    const [type, setType] = useState(session.type || 'Other');
    const [name, setName] = useState(session.name);
    const [description, setDescription] = useState(session.description);
    const [duration, setDuration] = useState(session.duration);
    const [startTime, setStartTime] = useState(session.startTime);
    const [startTimeInput, setStartTimeInput] = useState(minutesToTime(session.startTime, startHour));
    const [color, setColor] = useState(session.color);
    const [speakers, setSpeakers] = useState<Speaker[]>(session.speakers || []);
    const [hasConflict, setHasConflict] = useState(false);
    
    // Sync only time-related fields in real-time (allowing background drag & drop)
    useEffect(() => {
        setStartTime(session.startTime);
        setStartTimeInput(minutesToTime(session.startTime, 8));
        setDuration(session.duration);
    }, [session.startTime, session.duration]);

    // Reset metadata fields ONLY when switching to a different session
    useEffect(() => {
        setName(session.name);
        setDescription(session.description || '');
        setType(session.type || 'Other');
        setColor(session.color);
        setSpeakers(session.speakers || []);
    }, [session.id]);

    useEffect(() => {
        const parsedInputMins = timeToMinutes(startTimeInput, 8);
        const currentStartTime = parsedInputMins !== null ? parsedInputMins : startTime;

        const conflict = sessions.some(s =>
            s.id !== session.id &&
            s.roomId === session.roomId &&
            s.dayId === session.dayId &&
            !(currentStartTime + duration <= s.startTime || currentStartTime >= s.startTime + s.duration)
        );
        setHasConflict(conflict);
    }, [startTimeInput, duration, sessions, session.id, session.roomId, session.dayId, startHour, startTime]);

    const handleTypeSelect = (newType: string) => {
        setType(newType);
        const preset = PRESETS[newType];
        if (!preset) return;

        setColor(preset.color);
        // Remove old emoji/label prefixes if they exist
        const cleanName = name.replace(/^.*?\[.*?\]\s*/, '');
        setName(cleanName);
    };

    const handleAddSpeaker = () => {
        if (speakers.length >= 5) return;
        const newSpeaker: Speaker = {
            id: Math.random().toString(36).substring(7),
            name: '',
            title: '',
            company: '',
            isModerator: false
        };
        setSpeakers([...speakers, newSpeaker]);
    };

    const handleUpdateSpeaker = (id: string, updates: Partial<Speaker>) => {
        setSpeakers(prev => prev.map(s => {
            if (s.id !== id) return s;
            return { ...s, ...updates };
        }));
    };

    const handleToggleHost = (id: string) => {
        setSpeakers(prev => prev.map(s => {
            if (s.id === id) return { ...s, isModerator: !s.isModerator };
            return { ...s, isModerator: false };
        }));
    };

    const handleMoveSpeaker = (index: number, direction: 'up' | 'down') => {
        const newSpeakers = [...speakers];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= speakers.length) return;
        
        [newSpeakers[index], newSpeakers[newIndex]] = [newSpeakers[newIndex], newSpeakers[index]];
        setSpeakers(newSpeakers);
    };

    const handleShiftTime = (delta: number) => {
        let newMins = startTime + delta;
        const maxMins = (endHour - startHour) * 60 - duration;
        newMins = Math.max(0, Math.min(newMins, Math.round(maxMins / 5) * 5));
        
        setStartTime(newMins);
        setStartTimeInput(minutesToTime(newMins, 8));
        
        // Immediate Grid Sync
        onUpdate({ startTime: newMins });
    };

    const handleShiftDuration = (delta: number) => {
        const newDur = Math.max(5, duration + delta);
        setDuration(newDur);
        
        // Immediate Grid Sync
        onUpdate({ duration: newDur });
    };

    const handleRemoveSpeaker = (id: string) => {
        setSpeakers(prev => prev.filter(s => s.id !== id));
    };

    const handleTimeBlur = () => {
        let mins = timeToMinutes(startTimeInput, 8);
        if (mins === null || isNaN(mins)) {
            setStartTimeInput(minutesToTime(startTime, 8));
            return;
        }
        mins = Math.round(mins / 5) * 5;
        const gridStartMins = (startHour - 8) * 60;
        const gridEndMins = (endHour - 8) * 60;
        const maxMins = gridEndMins - duration;
        
        mins = Math.max(gridStartMins, Math.min(mins, maxMins));
        setStartTime(mins);
        setStartTimeInput(minutesToTime(mins, 8));
    };

    const handleSave = () => {
        // Ensure we have the latest time from the input field if it hasn't blurred
        let mins = timeToMinutes(startTimeInput, 8);
        if (mins !== null && !isNaN(mins)) {
            mins = Math.round(mins / 5) * 5;
            const gridStartMins = (startHour - 8) * 60;
            const gridEndMins = (endHour - 8) * 60;
            const maxMins = gridEndMins - duration;
            const finalMins = Math.max(gridStartMins, Math.min(mins, maxMins));
            
            // Re-check conflict with the final calculated mins
            const conflict = sessions.some(s =>
                s.id !== session.id &&
                s.roomId === session.roomId &&
                s.dayId === session.dayId &&
                !(finalMins + duration <= s.startTime || finalMins >= s.startTime + s.duration)
            );

            if (conflict) {
                toast.error("Cannot save: Time conflict with another session");
                setHasConflict(true);
                return;
            }

            onUpdate({ name, description, duration, startTime: finalMins, color, type, speakers });
        } else {
            onUpdate({ name, description, duration, startTime, color, type, speakers });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner" style={{ backgroundColor: color }}>
                            {(() => {
                                const Icon = PRESETS[type]?.icon || User;
                                return <Icon size={24} style={{ color: getContrastText(color) }} />;
                            })()}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">Section Properties</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Configure Session & Speakers</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-5">
                            {/* Session Type */}
                            <div className="space-y-3 pb-2">
                                <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Type Preset</label>
                                <div className="relative">
                                    <select 
                                        value={type} 
                                        onChange={(e) => handleTypeSelect(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 appearance-none font-bold text-slate-800 outline-none transition-all text-sm shadow-sm"
                                    >
                                        {Object.keys(PRESETS).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-3 pb-2">
                                <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Session Title</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Opening Keynote"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-bold text-slate-900 text-sm shadow-sm"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-3 pb-2 text-left">
                                <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Description (Abstract)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add session details, abstract or notes here..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-slate-600 text-xs min-h-[90px] resize-none shadow-sm leading-relaxed"
                                />
                            </div>

                             {/* Constraints with Steppers */}
                             <div className="flex gap-4 pb-2">
                                 <div className="space-y-3 flex-[1.2]">
                                     <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Start Time</label>
                                     <div className="relative group">
                                         <input
                                             type="text"
                                             value={startTimeInput}
                                             onChange={(e) => setStartTimeInput(e.target.value)}
                                             onBlur={handleTimeBlur}
                                             className={`w-full pl-4 pr-10 py-3 border rounded-xl font-bold outline-none transition-all text-sm shadow-sm ${hasConflict ? 'border-red-500 text-red-600 bg-red-50' : 'bg-white border-slate-200 focus:border-slate-400'}`}
                                         />
                                         <div className="absolute right-1 top-1.5 bottom-1.5 flex flex-col gap-0.5 w-7">
                                            <button 
                                                onClick={() => handleShiftTime(5)}
                                                className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 hover:bg-white active:bg-slate-100 transition-all shadow-sm"
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleShiftTime(-5)}
                                                className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 hover:bg-white active:bg-slate-100 transition-all shadow-sm"
                                            >
                                                <ChevronDownIcon size={12} />
                                            </button>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="space-y-3 flex-1">
                                     <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Dur (m)</label>
                                     <div className="relative group">
                                        <input
                                            type="number"
                                            value={duration}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 20;
                                                setDuration(val);
                                                onUpdate({ duration: val });
                                            }}
                                            className={`w-full pl-4 pr-10 py-3 border rounded-xl font-bold outline-none transition-all text-sm appearance-none shadow-sm ${hasConflict ? 'border-red-500 text-red-600 bg-red-50' : 'bg-white border-slate-200 focus:border-slate-400'}`}
                                            style={{ MozAppearance: 'textfield' }}
                                        />
                                        <div className="absolute right-1 top-1.5 bottom-1.5 flex flex-col gap-0.5 w-7">
                                            <button 
                                                onClick={() => handleShiftDuration(5)}
                                                className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 hover:bg-white active:bg-slate-100 transition-all shadow-sm"
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleShiftDuration(-5)}
                                                className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 hover:bg-white active:bg-slate-100 transition-all shadow-sm"
                                            >
                                                <ChevronDownIcon size={12} />
                                            </button>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                            {/* Theme Picker */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Color Palette</label>
                                <div className="grid grid-cols-5 gap-2.5">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`w-full aspect-[1.3/1] rounded-lg border-2 transition-all flex items-center justify-center group ${color === c ? 'border-slate-900 scale-105 shadow-md' : 'border-slate-100 opacity-80 hover:opacity-100 hover:border-slate-200'}`}
                                            style={{ backgroundColor: c }}
                                        >
                                            {color === c && (
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getContrastText(c) }}></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Speaker Management Section */}
                        <div className="space-y-4 border-l pl-0 flex flex-col min-h-0">
                                <div className="flex items-center justify-between shrink-0 mb-2 px-6">
                                <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">Speakers ({speakers.length}/5)</label>
                                <button 
                                    onClick={handleAddSpeaker} 
                                    disabled={speakers.length >= 5}
                                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 flex items-center gap-2 transition-all shadow-md active:scale-95"
                                >
                                    <Plus size={10} strokeWidth={4} /> Add Speaker
                                </button>
                            </div>

                            <div className="space-y-6 overflow-y-auto px-6 flex-1 pb-4">
                                {speakers.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl opacity-40 bg-slate-50/50">
                                        <User size={32} className="mx-auto mb-3 text-slate-300" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Speakers Profiled</p>
                                    </div>
                                )}
                                {speakers.map((s, idx) => (
                                    <div key={s.id} className="p-5 bg-white rounded-2xl border border-slate-200 relative group animate-in slide-in-from-right-2 hover:border-slate-400 transition-colors shadow-sm">
                                        {/* Small Tucked Reordering Arrows: Positioned Absolutely on Right to avoid pushing content */}
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button 
                                                disabled={idx === 0}
                                                onClick={() => handleMoveSpeaker(idx, 'up')}
                                                className="p-1 text-slate-300 hover:text-slate-900 disabled:opacity-0 bg-white/80 rounded-md shadow-sm border border-slate-100"
                                            >
                                                <MoveUp size={10} />
                                            </button>
                                            <button 
                                                disabled={idx === speakers.length - 1}
                                                onClick={() => handleMoveSpeaker(idx, 'down')}
                                                className="p-1 text-slate-300 hover:text-slate-900 disabled:opacity-0 bg-white/80 rounded-md shadow-sm border border-slate-100"
                                            >
                                                <MoveDown size={10} />
                                            </button>
                                        </div>

                                        <div className="space-y-4 pr-8">
                                            {/* Line 1: Full Name */}
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                                <input 
                                                    placeholder="e.g. Jane Doe"
                                                    value={s.name}
                                                    onChange={e => handleUpdateSpeaker(s.id, { name: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-300 transition-all"
                                                />
                                            </div>

                                            {/* Line 2: Company */}
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Company / Organization</label>
                                                <input 
                                                    placeholder="e.g. Tech Global Inc"
                                                    value={s.company}
                                                    onChange={e => handleUpdateSpeaker(s.id, { company: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-300 transition-all"
                                                />
                                            </div>

                                            {/* Line 3: Title + Host Toggle */}
                                            <div className="flex items-end gap-5">
                                                <div className="flex-1 space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Title / Position</label>
                                                    <input 
                                                        placeholder="e.g. Senior Architect"
                                                        value={s.title}
                                                        onChange={e => handleUpdateSpeaker(s.id, { title: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-300 transition-all"
                                                    />
                                                </div>
                                                <div className="flex flex-col space-y-2 items-center shrink-0">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Mark as Host</label>
                                                    <button 
                                                        onClick={() => handleToggleHost(s.id)}
                                                        className={`h-9 px-4 rounded-xl transition-all flex items-center gap-2 border shadow-sm ${s.isModerator ? 'bg-amber-500 border-amber-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-500'}`}
                                                    >
                                                        {s.isModerator ? <Star size={14} fill="white" /> : <Star size={14} />}
                                                        <span className="text-[10px] font-black uppercase tracking-wider">{s.isModerator ? 'Host' : 'Off'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleRemoveSpeaker(s.id)}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-white shadow-xl rounded-full flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 border border-slate-100 opacity-0 group-hover:opacity-100 transition-all z-10"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
                    <button onClick={() => { onDelete(session.id); onClose(); }} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg tracking-tight transition-all">
                        <Trash2 size={14} />
                        Delete Section
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={hasConflict}
                        className={`px-8 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all ${hasConflict ? 'bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-emerald-600/20'}`}
                    >
                        Save Session
                    </button>
                </div>
            </div>
        </div>
    );
};
