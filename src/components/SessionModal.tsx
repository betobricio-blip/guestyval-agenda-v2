import React, { useState, useEffect } from 'react';
import type { Session, Speaker } from '../types';
import { 
    X, Trash2, ChevronDown, Plus, User, Mic, ChevronUp, 
    ChevronDown as ChevronDownIcon, Star, Coffee, Users, Wrench, MessageSquare, StickyNote
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MODERN_PALETTE, minutesToTime, timeToMinutes } from '../constants';
import { getContrastText } from '../utils';

const COLORS = MODERN_PALETTE.map(p => p.bg);

const PRESETS: Record<string, { icon: any, color: string, label: string }> = {
  'Keynote': { icon: Mic, color: 'rgb(140, 190, 190)', label: 'Keynote' },
  'Panel': { icon: Users, color: 'rgb(178, 228, 227)', label: 'Panel' },
  'Break': { icon: Coffee, color: 'rgb(238, 250, 208)', label: 'Break' },
  'Workshop': { icon: Wrench, color: '#D1E2D3', label: 'Workshop' },
  'Guesty Workshop': { icon: Wrench, color: 'rgb(158, 188, 255)', label: 'Workshop' },
  'MasterClass': { icon: Star, color: '#CCE2E2', label: 'MasterClass' },
  'TPM Roundtables': { icon: Users, color: 'rgb(233, 226, 213)', label: 'Roundtable' },
  'Tech Talks': { icon: Star, color: 'rgb(90, 45, 45)', label: 'Tech Talk' },
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
    const [activeTab, setActiveTab] = useState<'session' | 'speakers' | 'notes'>('session');
    const [type, setType] = useState(session.type || 'Other');
    const [name, setName] = useState(session.name);
    const [description, setDescription] = useState(session.description);
    const [duration, setDuration] = useState(session.duration);
    const [startTime, setStartTime] = useState(session.startTime);
    const [startTimeInput, setStartTimeInput] = useState(minutesToTime(session.startTime, startHour));
    const [color, setColor] = useState(session.color);
    const [speakers, setSpeakers] = useState<Speaker[]>(session.speakers || []);
    const [internalNotes, setInternalNotes] = useState(session.internalNotes || '');
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
        setInternalNotes(session.internalNotes || '');
        setActiveTab('session'); // Reset to first tab when session changes
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
        if (newType === 'Other') {
            setType(''); // Empty by default for custom entry
            setColor('#CCE2E2'); 
            return;
        }

        setType(newType);
        const preset = PRESETS[newType];
        if (!preset) return;

        setColor(preset.color);
        // Remove old emoji/label prefixes if they exist
        const cleanName = name.replace(/^.*?\[.*?\]\s*/, '');
        setName(cleanName);
    };

    const handleAddSpeaker = () => {
        if (speakers.length >= 10) return; // Increased limit
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

            onUpdate({ name, description, duration, startTime: finalMins, color, type, speakers, internalNotes });
        } else {
            onUpdate({ name, description, duration, startTime, color, type, speakers, internalNotes });
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

                {/* Tabs Navigation */}
                <div className="flex px-6 border-b bg-slate-50/50">
                    <button 
                        onClick={() => setActiveTab('session')}
                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'session' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        1. Session Details
                    </button>
                    <button 
                        onClick={() => setActiveTab('speakers')}
                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'speakers' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        2. Speakers ({speakers.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('notes')}
                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${activeTab === 'notes' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <MessageSquare size={14} />
                        3. Notes {internalNotes.trim() && '●'}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'session' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Session Type */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Type Preset</label>
                                    <div className="relative">
                                        <select 
                                            value={PRESETS[type] ? type : 'Other'} 
                                            onChange={(e) => handleTypeSelect(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                                        >
                                            {Object.keys(PRESETS).map(k => (
                                                <option key={k} value={k}>{k}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Custom Type Field (shown when Other is selected or custom type exists) */}
                                {(!PRESETS[type] || type === '') && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Custom Type Name</label>
                                        <input 
                                            type="text" 
                                            value={type} 
                                            onChange={e => setType(e.target.value)}
                                            placeholder="Enter type (e.g. Networking)"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div className="space-y-3">
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
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Description (Abstract)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add session details, abstract or notes here..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-slate-600 text-xs min-h-[120px] resize-none shadow-sm leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Time & Duration */}
                                <div className="flex gap-4">
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
                                                <button onClick={() => handleShiftTime(5)} className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-sm"><ChevronUp size={12} /></button>
                                                <button onClick={() => handleShiftTime(-5)} className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-sm"><ChevronDownIcon size={12} /></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Dur (m)</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={duration}
                                                onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                                                className={`w-full pl-4 pr-10 py-3 border rounded-xl font-bold outline-none transition-all text-sm shadow-sm ${hasConflict ? 'border-red-500 text-red-600 bg-red-50' : 'bg-white border-slate-200 focus:border-slate-400'}`}
                                            />
                                            <div className="absolute right-1 top-1.5 bottom-1.5 flex flex-col gap-0.5 w-7">
                                                <button onClick={() => handleShiftDuration(5)} className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-sm"><ChevronUp size={12} /></button>
                                                <button onClick={() => handleShiftDuration(-5)} className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-sm"><ChevronDownIcon size={12} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 ml-1">Theme</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                className={`aspect-square rounded-lg border-2 transition-all flex items-center justify-center ${color === c ? 'border-slate-900 scale-110 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                                                style={{ backgroundColor: c }}
                                            >
                                                {color === c && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getContrastText(c) }}></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'speakers' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Speaker List Configuration</p>
                                <button 
                                    onClick={handleAddSpeaker} 
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95"
                                >
                                    <Plus size={14} strokeWidth={3} /> Add New Speaker
                                </button>
                            </div>

                            <div className="space-y-4">
                                {speakers.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl opacity-40">
                                        <User size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No speakers assigned to this session</p>
                                    </div>
                                ) : (
                                    speakers.map((s, idx) => (
                                        <div key={s.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 relative group hover:border-slate-400 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                                            <div className="grid grid-cols-12 gap-6 items-start">
                                                {/* Reorder Icons */}
                                                <div className="col-span-1 flex flex-col gap-2 pt-8">
                                                    <button disabled={idx === 0} onClick={() => handleMoveSpeaker(idx, 'up')} className="p-1.5 text-slate-300 hover:text-emerald-600 disabled:opacity-0 transition-colors"><ChevronUp size={16} strokeWidth={3}/></button>
                                                    <button disabled={idx === speakers.length - 1} onClick={() => handleMoveSpeaker(idx, 'down')} className="p-1.5 text-slate-300 hover:text-emerald-600 disabled:opacity-0 transition-colors"><ChevronDownIcon size={16} strokeWidth={3}/></button>
                                                </div>

                                                <div className="col-span-11 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Speaker Name</label>
                                                            <input placeholder="Jane Doe" value={s.name} onChange={e => handleUpdateSpeaker(s.id, { name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all shadow-sm" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company / Brand</label>
                                                            <input placeholder="e.g. Guesty" value={s.company} onChange={e => handleUpdateSpeaker(s.id, { company: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all shadow-sm" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-12 gap-4">
                                                        <div className="col-span-8 space-y-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Position / Title</label>
                                                            <input placeholder="e.g. Product Director" value={s.title} onChange={e => handleUpdateSpeaker(s.id, { title: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all shadow-sm" />
                                                        </div>
                                                        <div className="col-span-4 space-y-1.5 flex flex-col justify-end">
                                                            <button 
                                                                onClick={() => handleToggleHost(s.id)}
                                                                className={`h-[46px] w-full rounded-xl transition-all flex items-center justify-center gap-2 border font-black text-[10px] uppercase tracking-widest ${s.isModerator ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-500 hover:text-amber-500'}`}
                                                            >
                                                                <Star size={14} fill={s.isModerator ? "white" : "none"} />
                                                                {s.isModerator ? 'Primary Host' : 'Mark Host'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleRemoveSpeaker(s.id)}
                                                className="absolute -top-3 -right-3 w-8 h-8 bg-white shadow-2xl rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-all border border-slate-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Collaboration & Planner Notes</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-8 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-200 relative">
                                    <div className="absolute top-4 right-4 text-amber-200">
                                        <StickyNote size={40} />
                                    </div>
                                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2">Internal Observations</h3>
                                    <p className="text-xs text-amber-700/70 mb-6 leading-relaxed">
                                        These notes are private and will only be seen by people who import this JSON file. 
                                        Use this space for reminders, reviewer feedback, or logistics details.
                                    </p>
                                    
                                    <textarea 
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        placeholder="Write your internal notes here..."
                                        className="w-full bg-white border border-amber-200 rounded-2xl p-5 text-sm font-medium text-amber-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all shadow-inner min-h-[250px] resize-none"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-saved to session state</p>
                                </div>
                            </div>
                        </div>
                    )}
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
