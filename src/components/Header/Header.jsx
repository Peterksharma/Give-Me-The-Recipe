"use client";
import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Header = ({ onSearch, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSearch(url.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <header className="bg-blue-900 px-6 py-8">
      <div className="flex flex-col xl:flex-row items-center max-w-9xl mx-auto gap-4 xl:gap-0">
        {/* Left side - Title and tagline */}
        <div className="flex flex-col w-full xl:w-1/3 pl-0 xl:pl-[2vw] min-w-0 text-center xl:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl text-white font-extrabold whitespace-nowrap" style={{ fontFamily: 'Corinthia, cursive' }}>
            Give Me The Recipe
          </h1>
          <p className="text-yellow-400 text-xs sm:text-sm md:text-base font-medium tracking-[0.3em] whitespace-nowrap">
            Recipe Extractor Website
          </p>
        </div>

        {/* Center - Search input */}
        <div className="flex justify-center items-center w-full xl:flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="relative w-full max-w-[90vw] xl:max-w-[40vw]">
            <Input
              type="text"
              placeholder="Enter the URL here to Extract the recipe"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="pr-12 bg-white border-gray-300 rounded-lg text-gray-600 placeholder-gray-400 w-full disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

        {/* Right side - Empty space for balance (hidden on mobile) */}
        <div className="hidden xl:block w-1/3"></div>
      </div>
    </header>
  );
};

export default Header;
