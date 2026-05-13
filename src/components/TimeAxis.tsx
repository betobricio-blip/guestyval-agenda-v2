import React from 'react';
import { PIXELS_PER_MINUTE, GRID_HEADER_HEIGHT, GRID_GUTTER_TOP } from '../constants';

interface TimeAxisProps {
    startHour: number;
    endHour: number;
}

export const TimeAxis: React.FC<TimeAxisProps> = ({ startHour, endHour }) => {
    const times = [];
    const startMins = startHour * 60;
    const endMins = endHour * 60;
    
    for (let m = startMins; m <= endMins; m += 30) {
        const hh = Math.floor(m / 60);
        const mm = Math.floor(m % 60);
        times.push(`${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`);
    }

    return (
        <div className="w-16 border-r bg-slate-50 relative no-print shrink-0" 
             style={{ height: `${(endHour - startHour) * 60 * PIXELS_PER_MINUTE}px` }}>
            {times.map((time) => {
                const [h, m] = time.split(':').map(Number);
                const offsetMinutes = (h - startHour) * 60 + m;
                const top = offsetMinutes * PIXELS_PER_MINUTE;
                
                return (
                    <div
                        key={time}
                        className="absolute w-full h-0 overflow-visible flex items-end justify-center text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] pointer-events-none"
                        style={{ 
                            top: `${top}px`
                        }}
                    >
                        <span className="bg-slate-50 px-1 z-10 leading-none mb-[-1px]">{time}</span>
                    </div>
                );
            })}
        </div>
    );
};
