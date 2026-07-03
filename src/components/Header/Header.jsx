"use client";
import React from 'react';
import { Search, Loader2, History } from 'lucide-react';

/**
 * Header — the wordmark and the single input that drives the app.
 * Controlled: the URL value lives in the page so shared deep links can
 * pre-fill it.
 */
const Header = ({ url, onUrlChange, onSearch, isLoading, onOpenRecents }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSearch(url.trim());
    }
  };

  return (
    <header className="relative bg-gradient-to-b from-blue-950 to-blue-900 px-6 pt-8 pb-9 sm:pt-10 sm:pb-11">
      <button
        onClick={onOpenRecents}
        aria-label="Open recent recipes"
        title="Recent recipes"
        className="absolute left-4 top-4 sm:left-6 sm:top-6 p-2 text-blue-300 hover:text-yellow-400 active:scale-90 transition"
      >
        <History className="w-5 h-5" />
      </button>
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
        <div className="text-center">
          <h1
            className="text-5xl sm:text-6xl text-white font-bold leading-tight"
            style={{ fontFamily: 'var(--font-corinthia), cursive' }}
          >
            Give Me The Recipe
          </h1>
          <p className="text-yellow-400/90 text-[11px] sm:text-xs font-medium tracking-[0.35em] uppercase mt-1">
            Paste a link · Keep the recipe
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
          <input
            type="text"
            placeholder="Paste a recipe URL…"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={isLoading}
            aria-label="Recipe URL"
            className="w-full h-12 rounded-full bg-white pl-5 pr-14 text-gray-700 placeholder-gray-400 shadow-lg shadow-blue-950/30 outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 transition-shadow disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            aria-label="Extract recipe"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-blue-900 text-white flex items-center justify-center hover:bg-blue-700 active:scale-90 transition disabled:opacity-40 disabled:hover:bg-blue-900 disabled:active:scale-100"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </header>
  );
};

export default Header;
