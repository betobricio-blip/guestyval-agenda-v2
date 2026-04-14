import React, { useState } from 'react';
import { X, Monitor, Smartphone, Layout, Palette, Type, Code, Check, Download, Globe, List, Grid } from 'lucide-react';
import type { Room, Session } from '../types';
import { minutesToTime12 } from '../constants';
import { toast } from 'react-hot-toast';
import { DescriptiveListPreview } from './DescriptiveListPreview';

interface ThemeConfig {
    primaryColor: string;
    fontFamily: string;
    borderRadius: number;
    compactMode: boolean;
    headlineColor: string;
    bodyTextColor: string;
    showHeadline: boolean;
}

interface ExporterViewProps {
    rooms: Room[];
    sessions: Session[];
    eventName: string;
    onClose: () => void;
    daySettings: Record<string, { startHour: number; endHour: number }>;
}

export const ExporterView: React.FC<ExporterViewProps> = ({
    rooms,
    sessions,
    eventName,
    onClose,
    daySettings
}) => {
    const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
    const [exportMode, setExportMode] = useState<'grid' | 'list'>('list');
    const [selectedRoom, setSelectedRoom] = useState<string>('all');
    const [selectedDay, setSelectedDay] = useState<string>('all');
    const [theme, setTheme] = useState<ThemeConfig>({
        primaryColor: '#10b981',
        fontFamily: 'Inter',
        borderRadius: 8,
        compactMode: false,
        headlineColor: '#1e293b',
        bodyTextColor: '#64748b',
        showHeadline: true
    });
    const [copying, setCopying] = useState(false);

    const fonts = ['Inter', 'Roboto', 'Playfair Display'];
    
    // Day IDs from settings keys
    const dayIds = Object.keys(daySettings);

    const generateHTML = () => {
        const activeDayIds = selectedDay === 'all' ? dayIds : [selectedDay];
        
        // Inline version of contrast helper for the standalone export
        const getContrast = (hexcolor: string) => {
            if (!hexcolor || hexcolor.length < 6) return '#1e293b';
            const hex = hexcolor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 150) ? '#1e293b' : '#f8fafc';
        };
        
        if (exportMode === 'grid') {
            const css = `
                :root {
                    --primary: ${theme.primaryColor};
                    --headline: ${theme.headlineColor};
                    --body: ${theme.bodyTextColor};
                    --radius: ${theme.borderRadius}px;
                    --font: '${theme.fontFamily}', sans-serif;
                }
                body { font-family: var(--font); background: #f8fafc; color: var(--body); margin: 0; padding: 20px; }
                .agenda-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: var(--radius); box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
                .header { padding: 30px; background: var(--primary); color: white; border-bottom: 1px solid rgba(0,0,0,0.1); display: ${theme.showHeadline ? 'block' : 'none'}; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; }
                .day-section { padding: 20px; }
                .day-title { font-size: 14px; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; border-bottom: 2px solid var(--primary); display: inline-block; }
                .rooms-grid { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 10px; }
                .room-col { min-width: 240px; flex: 1; min-height: 400px; background: #f1f5f9; border-radius: calc(var(--radius) / 2); padding: 10px; position: relative; }
                .room-name { font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; text-align: center; color: #1e293b; letter-spacing: 0.1em; }
                .room-meta { font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px; text-align: center; color: #94a3b8; }
                .session { position: absolute; left: 10px; right: 10px; background: white; border-radius: calc(var(--radius) / 4); padding: 10px; border-left: 4px solid var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                .session-name { font-size: 13px; font-weight: 700; margin: 0; color: var(--headline); }
                .session-time { font-size: 11px; font-weight: 500; color: var(--body); margin-top: 4px; }
                @media (max-width: 768px) {
                    .rooms-grid { flex-direction: column; }
                    .session { position: relative; left: 0; right: 0; top: 0 !important; margin-bottom: 10px; border-left: 4px solid var(--primary); }
                }
            `;

            const daysHTML = activeDayIds.map(dayId => {
                const settings = daySettings[dayId];
                const filteredRooms = rooms
                    .filter((r: Room) => !r.daySettings[dayId]?.isHidden)
                    .filter((r: Room) => selectedRoom === 'all' || r.id === selectedRoom);

                if (filteredRooms.length === 0) return '';

                return `
                    <div class="day-section">
                        <div class="day-title">${dayId === 'day-1' ? 'First Day' : dayId.replace('day-', 'Day ')}</div>
                        <div class="rooms-grid">
                            ${filteredRooms.map(room => `
                                <div class="room-col">
                                    <div class="room-name">${room.name}</div>
                                    <div class="room-meta">${room.daySettings[dayId]?.capacity} PPL | ${room.daySettings[dayId]?.setupType}</div>
                                    ${sessions.filter((s: Session) => s.roomId === room.id && s.dayId === dayId)
                                        .sort((a: Session, b: Session) => a.startTime - b.startTime)
                                        .map(s => `
                                            <div class="session" style="top: ${s.startTime * 2}px; height: ${s.duration * 2}px; background-color: ${s.color}; color: ${getContrast(s.color)};">
                                                <div class="session-name">${s.name}</div>
                                                <div class="session-time">${minutesToTime12(s.startTime, settings.startHour)} (${s.duration}m)</div>
                                            </div>
                                        `).join('')}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');

            return `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Playfair+Display:wght@700;900&family=Roboto:wght@400;700&display=swap" rel="stylesheet"><style>${css}</style></head><body><div class="agenda-container"><div class="header"><h1>${eventName}</h1></div>${daysHTML}</div></body></html>`;
        } else {
            const css = `
                body { font-family: '${theme.fontFamily}', sans-serif; background: #fff; color: ${theme.bodyTextColor}; margin: 0; padding: 60px 40px; }
                .agenda-container { max-width: 900px; margin: 0 auto; }
                .header { margin-bottom: 60px; border-bottom: 6px solid ${theme.primaryColor}; padding-bottom: 30px; display: ${theme.showHeadline ? 'block' : 'none'}; }
                .header h1 { color: ${theme.headlineColor}; font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -0.04em; }
                .day-title { font-size: 16px; font-weight: 900; color: ${theme.primaryColor}; text-transform: uppercase; letter-spacing: 0.4em; margin: 60px 0 30px 0; border-bottom: 3px solid ${theme.primaryColor}; display: inline-block; }
                .room-section { margin-top: 40px; }
                .room-header { background: #f8fafc; padding: 15px 25px; border-radius: 12px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 30px; border: 1px solid #f1f5f9; }
                .room-meta { color: #cbd5e1; margin-left: 15px; font-weight: 700; }
                .session-block { padding: 40px 0; border-bottom: 1px solid #f1f5f9; }
                .session-block:last-child { border-bottom: none; }
                .time-line { font-size: 13px; font-weight: 900; color: ${theme.primaryColor}; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
                .session-title { color: ${theme.headlineColor}; font-size: 26px; font-weight: 900; margin: 0 0 15px 0; line-height: 1.1; letter-spacing: -0.02em; }
                .session-desc { font-size: 16px; line-height: 1.7; margin-bottom: 25px; color: ${theme.bodyTextColor}; opacity: 0.8; }
                .session-footer { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; border-top: 2px solid #f8fafc; padding-top: 20px; margin-top: 25px; display: flex; flex-wrap: wrap; gap: 20px; }
            `;

            const daysHTML = activeDayIds.map(dayId => {
                const settings = daySettings[dayId];
                const filteredRooms = rooms
                    .filter((r: Room) => !r.daySettings[dayId]?.isHidden)
                    .filter((r: Room) => selectedRoom === 'all' || r.id === selectedRoom);
                
                const roomSections = filteredRooms.map(room => {
                    const roomSessions = sessions
                        .filter((s: Session) => s.dayId === dayId && s.roomId === room.id)
                        .sort((a: Session, b: Session) => a.startTime - b.startTime);

                    if (roomSessions.length === 0) return '';

                    return `
                        <div class="room-section">
                            <div class="room-header">
                                ${room.name} <span class="room-meta">| ${room.daySettings[dayId]?.capacity} PPL | ${room.daySettings[dayId]?.setupType}</span>
                            </div>
                            ${roomSessions.map(s => `
                                <div class="session-block">
                                    <div class="time-line">${minutesToTime12(s.startTime, settings.startHour)} - ${minutesToTime12(s.startTime + s.duration, settings.startHour)}</div>
                                    <h3 class="session-title">${s.name}</h3>
                                    ${s.description ? `<p class="session-desc">${s.description}</p>` : ''}
                                    ${s.speakers && s.speakers.length > 0 ? `
                                        <div class="session-footer">
                                            ${[...s.speakers].sort((a, b) => (a.isModerator === b.isModerator ? 0 : a.isModerator ? -1 : 1)).map(sp => `
                                                <div style="display: flex; align-items: center; gap: 8px; margin-right: 20px;">
                                                    ${sp.isModerator ? '<span style="color: #f59e0b;">★</span> <span style="font-weight: 900; color: #1e293b;">Host:</span>' : ''} 
                                                    <span style="font-weight: 700;">${sp.name}</span>
                                                    ${sp.company ? `<span style="opacity: 0.5; font-size: 10px; margin-left: 4px;">• ${sp.company}</span>` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `;
                }).join('');

                if (!roomSections.trim()) return '';

                return `
                    <span class="day-title">${dayId === 'day-1' ? 'First Day' : dayId.replace('day-', 'Day ')}</span>
                    ${roomSections}
                `;
            }).join('');

            return `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=Playfair+Display:wght@700;900&family=Roboto:wght@400;700&display=swap" rel="stylesheet"><style>${css}</style></head><body><div class="agenda-container"><div class="header"><h1>${eventName}</h1></div>${daysHTML}</div></body></html>`;
        }
    };

    const handleCopyCode = () => {
        const html = generateHTML();
        navigator.clipboard.writeText(html);
        setCopying(true);
        toast.success("Standalone HTML copied to clipboard!");
        setTimeout(() => setCopying(false), 2000);
    };

    const handleDownload = () => {
        const html = generateHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agenda_${eventName.toLowerCase().replace(/\s+/g, '_')}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const activeDayIds = selectedDay === 'all' ? dayIds : [selectedDay];

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-900 animate-in fade-in duration-300">
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-800/50 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">P</div>
                    <div>
                        <h2 className="text-sm font-bold text-white leading-none">Publishing Hub</h2>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Agenda Export Engine</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                    <button onClick={() => setView('desktop')} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${view === 'desktop' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                        <Monitor size={14} /> Desktop
                    </button>
                    <button onClick={() => setView('mobile')} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${view === 'mobile' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                        <Smartphone size={14} /> Mobile
                    </button>
                </div>

                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                    <X size={20} />
                </button>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <aside className="w-[320px] border-r border-white/10 bg-slate-800 flex flex-col shrink-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Layout size={12} /> Export Mode
                            </label>
                            <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5">
                                <button 
                                    onClick={() => setExportMode('grid')}
                                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold transition-all ${exportMode === 'grid' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Grid size={12} /> Grid View
                                </button>
                                <button 
                                    onClick={() => setExportMode('list')}
                                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold transition-all ${exportMode === 'list' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <List size={12} /> List View
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Palette size={12} /> Day Selection
                            </label>
                            <select 
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/5 text-white rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                            >
                                <option value="all">All Days</option>
                                {dayIds.map(id => (
                                    <option key={id} value={id}>{id.replace('day-', 'Day ')}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Globe size={12} /> Room Filter
                            </label>
                            <select 
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/5 text-white rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                            >
                                <option value="all">All Rooms (Sequential)</option>
                                {rooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-6">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Palette size={12} /> UI Customization
                            </label>
                            
                            <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-slate-300">Accent Color</span>
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} className="bg-transparent text-emerald-400 text-[10px] w-16 text-right outline-none font-mono" />
                                            <input type="color" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} className="w-4 h-4 rounded-full border-0 p-0 overflow-hidden cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-slate-300">Headline Color</span>
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={theme.headlineColor} onChange={e => setTheme({...theme, headlineColor: e.target.value})} className="bg-transparent text-slate-400 text-[10px] w-16 text-right outline-none font-mono" />
                                            <input type="color" value={theme.headlineColor} onChange={e => setTheme({...theme, headlineColor: e.target.value})} className="w-4 h-4 rounded-full border-0 p-0 overflow-hidden cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-slate-300">Body Text Color</span>
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={theme.bodyTextColor} onChange={e => setTheme({...theme, bodyTextColor: e.target.value})} className="bg-transparent text-slate-500 text-[10px] w-16 text-right outline-none font-mono" />
                                            <input type="color" value={theme.bodyTextColor} onChange={e => setTheme({...theme, bodyTextColor: e.target.value})} className="w-4 h-4 rounded-full border-0 p-0 overflow-hidden cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-2">
                                    <span className="text-[11px] font-bold text-slate-300">Show Event Headline</span>
                                    <button 
                                        onClick={() => setTheme({ ...theme, showHeadline: !theme.showHeadline })}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${theme.showHeadline ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme.showHeadline ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Type size={12} /> Typography
                            </label>
                            <div className="space-y-2">
                                {fonts.map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setTheme({ ...theme, fontFamily: f })}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all text-xs font-bold ${theme.fontFamily === f ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10'}`}
                                        style={{ fontFamily: f }}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 space-y-3">
                        <button onClick={handleCopyCode} className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 ${copying ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 shadow-xl shadow-white/5 hover:bg-emerald-50'}`}>
                            {copying ? <Check size={14} /> : <div className="flex items-center gap-2"><Code size={14} /> <span>Copy Standalone HTML</span></div>}
                        </button>
                        <button onClick={handleDownload} className="w-full py-3 bg-slate-900 border border-white/5 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-slate-900/50 transition-all active:scale-95 group">
                            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" /> Download .html
                        </button>
                    </div>
                </aside>

                <div className="flex-1 bg-slate-950 p-8 flex flex-col items-center justify-start overflow-y-scroll h-full no-scrollbar scroll-smooth focus:outline-none">
                    <div className="mb-6 flex flex-col items-center shrink-0">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-500/20 mb-2">Live Preview Engine v2.5</span>
                        <h1 className="text-white text-xl font-black">{eventName} Agenda</h1>
                    </div>
                    
                    <div className={`bg-white shadow-[0_30px_100px_rgba(0,0,0,0.5)] transition-all duration-500 flex flex-col ${view === 'desktop' ? 'w-full max-w-[1000px] h-fit min-h-full' : 'w-[375px] h-fit border-8 border-slate-900 rounded-[40px] sticky top-8'}`}
                         style={{ borderRadius: view === 'desktop' ? `${theme.borderRadius}px` : '40px', fontFamily: theme.fontFamily }}>
                        
                        {exportMode === 'grid' ? (
                            <div className="flex flex-col flex-1">
                                {theme.showHeadline && (
                                    <div className="p-8 pb-4 border-b border-slate-100 shrink-0" style={{ backgroundColor: theme.primaryColor }}>
                                        <h2 className="text-white text-2xl font-black uppercase tracking-tighter">{eventName}</h2>
                                    </div>
                                )}
                                <div className="p-6 bg-slate-50/50 flex-1">
                                    {activeDayIds.map((dayId) => {
                                        const visibleRooms = rooms
                                            .filter((r: Room) => !r.daySettings[dayId]?.isHidden)
                                            .filter((r: Room) => selectedRoom === 'all' || r.id === selectedRoom);

                                        if (visibleRooms.length === 0) return null;

                                        return (
                                            <div key={dayId} className="mb-12 last:mb-0">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="h-px bg-slate-200 flex-1"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm" style={{ color: theme.primaryColor }}>
                                                        {dayId === 'day-1' ? 'First Day' : dayId.replace('day-', 'Day ')}
                                                    </span>
                                                    <div className="h-px bg-slate-200 flex-1"></div>
                                                </div>
                                                <div className={`flex gap-4 ${view === 'mobile' ? 'flex-col' : 'overflow-x-auto pb-4 scrollbar-hide'}`}>
                                                    {visibleRooms.map(room => (
                                                        <div key={room.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-w-[240px] shrink-0 ${view === 'mobile' ? 'w-full' : ''}`}>
                                                            <div className="p-4 border-b border-slate-50 bg-slate-50/30 text-center">
                                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">{room.name}</h3>
                                                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                                                    {room.daySettings[dayId]?.capacity} PPL | {room.daySettings[dayId]?.setupType}
                                                                </div>
                                                            </div>
                                                            <div className={`p-3 space-y-3 relative ${view === 'desktop' ? 'h-[400px]' : ''}`}>
                                                                {sessions.filter((s: Session) => s.roomId === room.id && s.dayId === dayId)
                                                                    .sort((a: Session, b: Session) => a.startTime - b.startTime)
                                                                    .map(session => (
                                                                        <div key={session.id} className={`p-3 rounded-xl border border-slate-100 bg-white transition-all shadow-sm ${view === 'desktop' ? 'absolute left-3 right-3' : ''}`}
                                                                            style={{ borderLeft: `4px solid ${theme.primaryColor}`, top: view === 'desktop' ? `${session.startTime * 1.5 + 10}px` : 'auto', height: view === 'desktop' ? `${session.duration * 1.5}px` : 'auto', borderRadius: `${theme.borderRadius / 2}px` }}>
                                                                            <h4 className="text-xs font-bold leading-tight" style={{ color: theme.headlineColor }}>{session.name}</h4>
                                                                            <div className="flex items-center gap-2 mt-1 opacity-60">
                                                                                <Globe size={10} style={{ color: theme.primaryColor }} />
                                                                                <span className="text-[9px] font-bold uppercase tracking-tight" style={{ color: theme.bodyTextColor }}>
                                                                                    {minutesToTime12(session.startTime, daySettings[dayId].startHour)} • {session.duration}m
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="p-0 bg-white flex-1 flex flex-col">
                                {activeDayIds.map(dayId => (
                                    <DescriptiveListPreview 
                                        key={`${dayId}-${selectedRoom}-${theme.fontFamily}-${theme.headlineColor}`}
                                        dayId={dayId}
                                        sessions={sessions}
                                        rooms={rooms.filter((r: Room) => !r.daySettings[dayId]?.isHidden)}
                                        theme={theme}
                                        selectedRoom={selectedRoom}
                                        startHour={daySettings[dayId].startHour}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 mb-20 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Scroll Down to View Full Agenda
                    </div>
                </div>
            </main>
        </div>
    );
};
