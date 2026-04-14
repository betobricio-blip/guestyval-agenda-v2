import React from 'react';
import { PIXELS_PER_MINUTE } from '../constants';

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
             style={{ height: `${(endHour - startHour) * 60 * PIXELS_PER_MINUTE + 20}px`, marginTop: '20px' }}>
            {times.map((time) => {
                const [h, m] = time.split(':').map(Number);
                const offsetMinutes = (h - startHour) * 60 + m;
                const top = offsetMinutes * PIXELS_PER_MINUTE;
                return (
                    <div
                        key={time}
                        className="absolute w-full text-[10px] font-black text-slate-300 flex items-start justify-center uppercase tracking-[0.1em]"
                        style={{ top: `${top}px` }}
                    >
                        <span className="mt-[-6px] bg-slate-50 px-1 z-10">{time}</span>
                    </div>
                );
            })}
        </div>
    );
};
