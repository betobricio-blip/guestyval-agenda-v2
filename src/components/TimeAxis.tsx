import React from 'react';
import { PIXELS_PER_MINUTE, GRID_HEADER_HEIGHT, GRID_GUTTER_TOP } from '../constants';

interface TimeAxisProps {
    startHour: number;
    endHour: number;
}

export const TimeAxis: React.FC<TimeAxisProps> = ({ startHour, endHour }) => {
    const times = [];
    for (let h = startHour; h < endHour; h++) {
        times.push(`${h.toString().padStart(2, '0')}:00`);
        times.push(`${h.toString().padStart(2, '0')}:30`);
    }
    times.push(`${endHour.toString().padStart(2, '0')}:00`);

    return (
        <div className="w-16 border-r bg-slate-50 relative no-print shrink-0" 
             style={{ height: `${(endHour - startHour) * 60 * PIXELS_PER_MINUTE + GRID_HEADER_HEIGHT + GRID_GUTTER_TOP}px` }}>
            {times.map((time) => {
                const [h, m] = time.split(':').map(Number);
                const offsetMinutes = (h - startHour) * 60 + m;
                const top = (offsetMinutes * PIXELS_PER_MINUTE) + GRID_HEADER_HEIGHT + GRID_GUTTER_TOP;
                return (
                    <div
                        key={time}
                        className="absolute w-full h-0 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-[0.1em]"
                        style={{ top: `${top}px` }}
                    >
                        <span className="bg-slate-50 px-1 z-10 leading-none">{time}</span>
                    </div>
                );
            })}
        </div>
    );
};
