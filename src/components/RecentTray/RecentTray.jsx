"use client";
import { History, X, Trash2 } from 'lucide-react';
import React, { useEffect } from 'react';

/**
 * RecentTray — the recipe box. A left-side tray, hidden by default,
 * listing recently looked-up recipes. Selecting one re-extracts it;
 * each entry can be removed, or the whole box emptied.
 */

const hostnameOf = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
};

export default function RecentTray({ open, recents, onClose, onSelect, onRemove, onClear }) {
    // Esc closes the tray while it is open.
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-blue-950/40 transition-opacity duration-300 motion-reduce:transition-none ${
                    open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />

            {/* Tray */}
            <aside
                role="dialog"
                aria-label="Recent recipes"
                className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-[#FFFEFA] shadow-2xl flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="bg-blue-950 text-white px-4 py-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-yellow-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider flex-1">
                        Recent recipes
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close recent recipes"
                        className="p-1 text-blue-300 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {recents.length === 0 ? (
                        <p
                            className="px-6 py-10 text-center text-xl text-gray-500"
                            style={{ fontFamily: 'var(--font-gaegu), cursive' }}
                        >
                            Recipes you look up will appear here.
                        </p>
                    ) : (
                        <ul>
                            {recents.map((entry) => (
                                <li
                                    key={entry.url}
                                    className="group relative border-b"
                                    style={{ borderColor: '#C9DAEB' }}
                                >
                                    <button
                                        onClick={() => onSelect(entry.url)}
                                        className="w-full text-left px-4 py-3 pr-10 hover:bg-[#FAF6EC] transition-colors"
                                    >
                                        <span
                                            className="block text-lg leading-snug text-gray-800 line-clamp-2"
                                            style={{ fontFamily: 'var(--font-gaegu), cursive' }}
                                        >
                                            {entry.title}
                                        </span>
                                        <span className="block text-xs text-gray-500 truncate">
                                            {hostnameOf(entry.url)}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => onRemove(entry.url)}
                                        aria-label={`Remove ${entry.title}`}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-500 transition"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {recents.length > 0 && (
                    <div className="border-t border-gray-200 px-4 py-3">
                        <button
                            onClick={onClear}
                            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear history
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
