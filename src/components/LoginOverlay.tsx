import React, { useState } from 'react';
import { Lock, ChevronRight } from 'lucide-react';

interface LoginOverlayProps {
    onLogin: (password: string) => boolean;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onLogin(password);
        if (!success) {
            setError(true);
            setPassword('');
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0d4741]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            
            <div className="relative w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl shadow-xl shadow-black/20 animate-bounce group-hover:scale-110 transition-transform">
                        <Lock size={32} className="text-[#0d4741]" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white tracking-tight">GuestyVal 2026</h1>
                        <p className="text-white/60 font-medium">Agenda Builder Gatekeeper</p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <div className="relative group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Access Password"
                                className={`w-full bg-white/5 border-2 ${error ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/30'} rounded-2xl px-6 py-4 text-white text-center text-lg font-bold placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all`}
                                autoFocus
                            />
                            {error && (
                                <p className="absolute -bottom-6 left-0 right-0 text-red-400 text-xs font-bold animate-bounce">
                                    Incorrect password. Access denied.
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-white text-[#0d4741] font-black py-4 rounded-2xl shadow-xl shadow-black/20 hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span>Enter Builder</span>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="pt-4">
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Authorized Personnel Only</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
