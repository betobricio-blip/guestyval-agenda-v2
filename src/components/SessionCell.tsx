import React, { useState } from 'react';
import { GripVertical, User, Star } from 'lucide-react';
import { getContrastText } from '../utils';
import { PIXELS_PER_MINUTE, minutesToTime } from '../constants';
import type { Session } from '../types';

interface SessionCellProps {
    session: Session;
    onClick: () => void;
    onInitiateDrag: (e: React.MouseEvent) => void;
    startHour: number;
    endHour: number;
    isDimmed?: boolean;
    suppressHover?: boolean;
    tooltipPosition?: 'left' | 'right';
    readOnly?: boolean;
    dragStartTime?: number | null;
}

export const SessionCell: React.FC<SessionCellProps> = ({ 
    session, 
    onClick, 
    onInitiateDrag, 
    startHour,
    endHour,
    isDimmed,
    suppressHover,
    tooltipPosition = 'right',
    readOnly,
    dragStartTime
}) => {
    const { name, description, startTime, duration, color, speakers, type } = session;
    const firstSpeaker = speakers && speakers.length > 0 ? speakers[0] : null;
    const [isHovered, setIsHovered] = useState(false);

    const textColor = getContrastText(color);
    const isLight = textColor === '#1e293b';

    const relativeStartTime = startTime - ((startHour - 8) * 60);
    const sessionStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${relativeStartTime * PIXELS_PER_MINUTE}px`,
        height: `${duration * PIXELS_PER_MINUTE}px`,
        left: '4px',
        right: '4px',
        backgroundColor: color,
        zIndex: isHovered ? 100 : (isDimmed ? 10 : 20),
        cursor: 'default',
        transition: 'all 0.1s ease',
        borderRadius: '8px',
        boxShadow: isHovered ? (isLight ? '0 10px 25px rgba(0,0,0,0.1)' : '0 10px 25px rgba(0,0,0,0.3)') : '0 2px 4px rgba(0,0,0,0.05)',
        border: isHovered ? (isLight ? '1px solid rgba(0,0,0,0.2)' : '1px solid rgba(255,255,255,0.2)') : '1px solid rgba(0,0,0,0.05)',
        opacity: isDimmed ? 0.3 : 1,
        pointerEvents: 'auto',
        color: textColor
    };

    const currentEndMins = startTime + duration;
    const isNearBottom = (currentEndMins - (startHour * 60)) > ((endHour - startHour) * 60 * 0.5); // Bottom 50%

    const tooltipClasses = `absolute w-[280px] bg-white text-slate-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 p-4 z-[9999] animate-in slide-in-from-top-1 fade-in duration-200 pointer-events-none 
    ${isNearBottom ? 'bottom-0' : 'top-0'}
    ${tooltipPosition === 'right' ? 'left-full ml-3' : 'right-full mr-3'}`;

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { 
                if (readOnly) return;
                e.stopPropagation(); 
                setIsHovered(false); 
                onClick(); 
            }}
            style={sessionStyle}
            className="flex items-stretch group overflow-visible hover:brightness-95 select-none"
        >
            {!readOnly && duration >= 15 && (
                <div 
                    className="w-5 flex items-center justify-center cursor-greedy active:cursor-grabbing hover:bg-black/5 transition-colors shrink-0 border-r border-black/5 z-10"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onInitiateDrag(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical size={14} className="text-slate-400 group-hover:text-slate-600" />
                </div>
            )}

            {/* Content Area */}
            <div 
                className={`flex-1 flex flex-col justify-center min-w-0 ${duration < 15 ? 'px-2' : 'px-3'}`}
                onMouseDown={(e) => {
                    if (!readOnly && duration < 15) {
                        e.stopPropagation();
                        onInitiateDrag(e);
                    }
                }}
            >
                <div 
                    className={`flex items-center gap-1.5 overflow-hidden font-extrabold whitespace-nowrap leading-none ${duration < 15 ? 'text-[9px]' : 'text-[11px]'}`} 
                    style={{ color: textColor }}
                >
                    <span className="truncate min-w-0">{name}</span>
                    {duration >= 15 && (
                        <>
                            <span className="opacity-30 shrink-0 font-normal">|</span>
                            <span className="shrink-0 font-bold opacity-80">
                                {minutesToTime(startTime, 8)} ({duration}m)
                            </span>
                        </>
                    )}
                </div>
                
                {/* Speaker Display (>45m) */}
                {duration > 45 && firstSpeaker && (
                    <div className="text-[9px] font-bold truncate mt-1 flex items-center gap-1.5 leading-tight opacity-80" style={{ color: textColor }}>
                        {firstSpeaker.isModerator ? <Star size={8} fill="currentColor" /> : <User size={8} />}
                        <span className="truncate">{firstSpeaker.name} {firstSpeaker.company ? `(${firstSpeaker.company})` : ''}</span>
                    </div>
                )}
            </div>

            {/* Speaker Info Popover (Hover Tooltip) */}
            {isHovered && !suppressHover && (
                <div className={tooltipClasses} style={{ zIndex: 3000 }}>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col border-b border-slate-100 pb-2">
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-tight">{type || 'Session'}</span>
                            <h4 className="text-[13px] font-bold leading-tight mt-1 text-slate-900">{name}</h4>
                            
                            {description && (
                                <p className="text-[11px] font-normal text-slate-500 mt-2 leading-relaxed break-words whitespace-pre-wrap">
                                    {description}
                                </p>
                            )}
                        </div>
                        
                        {speakers && speakers.length > 0 && (
                            <div className="space-y-3">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Featured Speakers</span>
                                {[...speakers].sort((a, b) => (a.isModerator === b.isModerator ? 0 : a.isModerator ? -1 : 1)).map(s => (
                                    <div key={s.id} className="flex flex-col bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900 leading-none">{s.name}</span>
                                            {s.isModerator && (
                                                <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1 border border-amber-200 uppercase tracking-widest">
                                                    <Star size={6} fill="currentColor" /> Session Host
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 leading-tight mt-1.5">
                                            {s.title}{s.company ? ` • ${s.company}` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-1 pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>{minutesToTime(dragStartTime ?? startTime, 8)} - {minutesToTime((dragStartTime ?? startTime) + duration, 8)}</span>
                            <span>{duration} minutes</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
