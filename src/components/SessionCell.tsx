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
    showSpeakers?: boolean;
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
    dragStartTime,
    showSpeakers
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

    const tooltipClasses = `absolute w-[340px] bg-white text-slate-800 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.18)] border border-slate-200 p-5 z-[9999] animate-in slide-in-from-top-1 fade-in duration-200 pointer-events-none 
    ${isNearBottom ? 'bottom-0' : 'top-0'}
    ${tooltipPosition === 'right' ? 'left-full ml-4' : 'right-full mr-4'}`;

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
                className={`flex-1 flex items-center min-w-0 ${duration < 15 ? 'px-1' : 'px-2'}`}
                onMouseDown={(e) => {
                    if (!readOnly && duration < 15) {
                        e.stopPropagation();
                        onInitiateDrag(e);
                    }
                }}
            >
                <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                    <div className="flex items-baseline gap-1.5 overflow-hidden">
                        {type && type.toLowerCase() !== 'other' && (
                            <span className={`uppercase tracking-tighter font-black opacity-60 shrink-0 ${duration < 15 ? 'text-[7px]' : 'text-[8px]'}`}>
                                [{type}]
                            </span>
                        )}
                        <span className={`font-extrabold truncate min-w-0 ${duration < 15 ? 'text-[9px]' : 'text-[11px]'}`} style={{ color: textColor }}>
                            {name}
                        </span>
                    </div>
                    
                    {/* Speaker Display (Condensed or with Toggle) */}
                    {showSpeakers && speakers && speakers.length > 0 ? (
                        <div 
                            className="text-[9px] font-bold mt-0.5 leading-tight opacity-90 overflow-hidden" 
                            style={{ 
                                color: textColor,
                                display: '-webkit-box',
                                WebkitLineClamp: duration < 30 ? 1 : 2,
                                WebkitBoxOrient: 'vertical'
                            }}
                        >
                            {(() => {
                                const sortedSpeakers = [...speakers].sort((a, b) => (b.isModerator ? 1 : 0) - (a.isModerator ? 1 : 0));
                                return sortedSpeakers.map((s, idx) => (
                                    <React.Fragment key={idx}>
                                        {s.name}{s.isModerator ? ' (M)' : ''}{idx < sortedSpeakers.length - 1 ? ', ' : ''}
                                    </React.Fragment>
                                ));
                            })()}
                        </div>
                    ) : (
                        duration > 45 && firstSpeaker && (
                            <div className="text-[9px] font-bold truncate mt-0.5 flex items-center gap-1.5 leading-tight opacity-80" style={{ color: textColor }}>
                                <User size={8} />
                                <span className="truncate">{firstSpeaker.name}</span>
                            </div>
                        )
                    )}
                </div>

                {/* Vertical Time Display */}
                {duration >= 15 && (
                    <div className="flex flex-col items-end justify-center ml-2 pl-2 border-l border-black/5 shrink-0 opacity-70">
                        <span className="text-[8px] font-black leading-none">{minutesToTime(startTime, 8)}</span>
                        <span className="text-[8px] font-black leading-none mt-1">{minutesToTime(startTime + duration, 8)}</span>
                    </div>
                )}
            </div>

            {/* Speaker Info Popover (Hover Tooltip) */}
            {isHovered && !suppressHover && (
                <div className={tooltipClasses} style={{ zIndex: 3000 }}>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col border-b border-slate-100 pb-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{type || 'Session'}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{duration}m</span>
                            </div>
                            <h4 className="text-[15px] font-black leading-tight mt-1.5 text-slate-900">{name}</h4>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-600">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                    {minutesToTime(dragStartTime ?? startTime, 8)} — {minutesToTime((dragStartTime ?? startTime) + duration, 8)}
                                </span>
                            </div>
                            
                            {description && (
                                <p className="text-[11px] font-medium text-slate-500 mt-3 leading-relaxed break-words whitespace-pre-wrap line-clamp-4">
                                    {description}
                                </p>
                            )}
                        </div>
                        
                        {speakers && speakers.length > 0 && (
                            <div className="space-y-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Speakers</span>
                                <div className="space-y-2">
                                    {[...speakers].sort((a, b) => (a.isModerator === b.isModerator ? 0 : a.isModerator ? -1 : 1)).map(s => (
                                        <div key={s.id} className="flex flex-col py-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[12px] font-bold text-slate-900 leading-none">{s.name}</span>
                                                {s.isModerator && (
                                                    <span className="text-[8px] font-black bg-amber-400 text-white px-1 rounded flex items-center gap-0.5 uppercase tracking-tighter">
                                                        <Star size={6} fill="white" /> Host
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 leading-none mt-1">
                                                {s.title}{s.company ? ` • ${s.company}` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-2 flex items-center justify-between text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                            <span>GuestyVal Agenda Builder</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
