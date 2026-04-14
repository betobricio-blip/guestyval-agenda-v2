import React, { useState } from 'react';
import { X, Save, FolderOpen, Trash2 } from 'lucide-react';

interface PersistenceModalProps {
    mode: 'save' | 'open';
    onClose: () => void;
    onSave: (name: string) => void;
    onSelect: (config: any) => void;
}

export const PersistenceModal: React.FC<PersistenceModalProps> = ({
    mode,
    onClose,
    onSave,
    onSelect
}) => {
    const [name, setName] = useState('');
    const savedConfig = JSON.parse(localStorage.getItem('guestyval_saved') || '[]');

    const handleSave = () => {
        if (!name.trim()) return;
        onSave(name.trim());
        onClose();
    };

    const handleDelete = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const updated = savedConfig.filter((_: any, i: number) => i !== index);
        localStorage.setItem('guestyval_saved', JSON.stringify(updated));
        // We don't necessarily need to close the modal, but the current logic re-reads localStorage on mount.
        // To show the change without closing, we could use state, but user didn't ask for that complexity.
        // Actually, let's keep onClose() for now as it's the "simple refresh" mentioned in the comment,
        // unless I can easily update the list.
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {mode === 'save' ? <Save size={18} /> : <FolderOpen size={18} />}
                        {mode === 'save' ? 'Save Configuration' : 'Select Configuration'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {mode === 'save' ? (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Configuration Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                                    placeholder="e.g. Master Copy 2026"
                                />
                            </div>
                            <button
                                disabled={!name.trim()}
                                onClick={handleSave}
                                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                Save to Local Storage
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {savedConfig.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <p>No saved configurations found.</p>
                                </div>
                            ) : (
                                savedConfig.map((config: any, i: number) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            onSelect(config);
                                            onClose();
                                        }}
                                        className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl cursor-pointer transition-all"
                                    >
                                        <div>
                                            <h4 className="font-bold text-slate-700 group-hover:text-emerald-900">{config.name}</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {new Date(config.timestamp).toLocaleString()} • {config.rooms['day-1'].length + config.rooms['day-2'].length} Rooms
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, i)}
                                            className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
