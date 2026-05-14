import React, { useRef } from 'react';
import { MoreVertical, Save, FolderOpen, Printer, DownloadCloud, UploadCloud, Globe, Settings } from 'lucide-react';
import type { ViewMode } from '../types';

interface TopNavProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    onAddSession: () => void;
    onSave: () => void;
    onSaveAs: () => void;
    onOpen: () => void;
    onPrint: () => void;
    onExport: () => void;
    onImport: (file: File) => void;
    onPublish: () => void;
    eventName: string;
    onOpenGlobalSettings: () => void;
    activeDayName: string;
    activeSaveName: string | null;
    isAuthenticated: boolean;
    showSpeakersInGrid: boolean;
    onToggleSpeakers: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
    viewMode,
    setViewMode,
    // onAddSession,
    onSave,
    onSaveAs,
    onOpen,
    onPrint,
    onExport,
    onImport,
    onPublish,
    eventName,
    onOpenGlobalSettings,
    activeDayName,
    activeSaveName,
    isAuthenticated,
    showSpeakersInGrid,
    onToggleSpeakers
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showActions, setShowActions] = React.useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImport(file);
        }
    };

    return (
        <nav className="h-12 border-b flex items-center justify-between px-6 sticky top-0 z-[999] no-print overflow-visible" style={{ backgroundColor: '#0d4741' }}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={onOpenGlobalSettings}>
                    <h1 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">{eventName} - Agenda Builder</h1>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    {isAuthenticated && (
                        <button
                            onClick={onSave}
                            className="px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 text-sm"
                            title={activeSaveName ? `Save (${activeSaveName})` : "Save Configuration"}
                        >
                            <Save size={16} />
                            {activeSaveName ? <span className="font-semibold">{activeSaveName}</span> : null}
                        </button>
                    )}
                    {activeSaveName && isAuthenticated && (
                        <button
                            onClick={onSaveAs}
                            className="px-2 py-0.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all text-[9px] font-medium border border-white/20 uppercase tracking-wider h-6"
                            title="Save as new"
                        >
                            Save As
                        </button>
                    )}
                    {isAuthenticated && (
                        <>
                            <div className="w-px h-6 bg-white/20 mx-1"></div>
                            <button
                                onClick={onOpen}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                title="Open Saved"
                            >
                                <FolderOpen size={18} />
                            </button>
                        </>
                    )}
                </div>
                <div className="flex bg-white/10 p-1 rounded-lg ml-2">
                    {(['Day 1', 'Day 2', 'Split'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === mode
                                ? 'bg-white text-emerald-900 shadow-sm'
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 ml-4 px-2 py-1 bg-white/5 rounded-lg border border-white/10 group cursor-pointer hover:bg-white/10 transition-all select-none" onClick={onToggleSpeakers}>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Speakers</span>
                    <div className={`w-7 h-3.5 rounded-full relative transition-all duration-300 ${showSpeakersInGrid ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all duration-300 shadow-sm`} style={{ left: showSpeakersInGrid ? '16px' : '2px' }}></div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-[11px] font-bold text-white/50 mr-4 uppercase tracking-[0.2em] whitespace-nowrap">
                    Viewing: <span className="text-white">{viewMode === 'Split' ? 'Combined View' : activeDayName}</span>
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className={`p-2 rounded-xl transition-all flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest ${showActions ? 'bg-white text-emerald-900 shadow-xl' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    >
                        <MoreVertical size={18} />
                        Project Actions
                    </button>

                    {showActions && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 z-[200] animate-in slide-in-from-top-2">
                            <button onClick={() => { onPrint(); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                <Printer size={16} /> Print Agenda
                            </button>
                             <button onClick={() => { onExport(); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                <DownloadCloud size={16} /> Export JSON
                            </button>
                            {isAuthenticated && (
                                <>
                                    <button onClick={() => { handleImportClick(); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                        <UploadCloud size={16} /> Import JSON
                                    </button>
                                    <div className="h-px bg-white/5 my-2"></div>
                                    <button onClick={() => { onOpenGlobalSettings(); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 hover:bg-amber-400/5 rounded-xl transition-all">
                                        <Settings size={16} /> Project Settings
                                    </button>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>

                <button
                    onClick={onExport}
                    className="px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 group font-black text-[11px] uppercase tracking-widest border border-white/20"
                >
                    <DownloadCloud size={18} className="text-emerald-400" />
                    Export JSON
                </button>

                <button
                    onClick={onPublish}
                    className="px-5 py-2 bg-emerald-500 text-white hover:bg-emerald-400 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 group font-black text-[11px] uppercase tracking-widest"
                >
                    <Globe size={18} />
                    Publish View
                </button>
            </div>
        </nav>
    );
};
