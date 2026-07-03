"use client";
import { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import RecentTray from '@/components/RecentTray/RecentTray';
import Footer from '@/components/Footer/Footer';
import { loadRecents, addRecent, removeRecent, clearRecents } from '@/utils/recentRecipes';

export default function Home() {
  const [url, setUrl] = useState('');
  const [recipeData, setRecipeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recents, setRecents] = useState([]);
  const [trayOpen, setTrayOpen] = useState(false);

  const handleRecipeExtract = async (targetUrl) => {
    setIsLoading(true);
    setError(null);

    try {
      // One endpoint fetches the page once and returns the whole recipe
      const response = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract recipe data');
      }

      // Map to the shape expected by RecipeCard; sourceUrl feeds the
      // share deep link.
      setRecipeData({
        title: data.title || 'Recipe Title',
        serves: data.serves || 'N/A',
        prepTime: data.prepTime || 'N/A',
        cookTime: data.cookTime || 'N/A',
        ingredients: data.ingredients || [],
        directions: data.instructions || [],
        sourceUrl: data.url
      });

      // Remember the lookup for the recent-recipes tray.
      setRecents((prev) => addRecent(prev, { url: targetUrl, title: data.title || targetUrl }));

      // Reflect the recipe in the address bar so the page itself is a
      // shareable link.
      window.history.replaceState(null, '', `/?recipe=${encodeURIComponent(targetUrl)}`);
    } catch (err) {
      setError(err.message);
      console.error('Error extracting recipe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // A shared link arrives as /?recipe=<url>: load that recipe on mount.
  // History is also read here — localStorage only exists client-side.
  useEffect(() => {
    setRecents(loadRecents());
    const shared = new URLSearchParams(window.location.search).get('recipe');
    if (shared) {
      setUrl(shared);
      handleRecipeExtract(shared);
    }
  }, []);

  const handleSelectRecent = (recentUrl) => {
    setTrayOpen(false);
    setUrl(recentUrl);
    handleRecipeExtract(recentUrl);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        url={url}
        onUrlChange={setUrl}
        onSearch={handleRecipeExtract}
        isLoading={isLoading}
        onOpenRecents={() => setTrayOpen(true)}
      />

      <RecentTray
        open={trayOpen}
        recents={recents}
        onClose={() => setTrayOpen(false)}
        onSelect={handleSelectRecent}
        onRemove={(recentUrl) => setRecents((prev) => removeRecent(prev, recentUrl))}
        onClear={() => setRecents(clearRecents())}
      />

      {/* The card grows with its content; the page scrolls. A faint
          graph-paper grid gives the card something to sit against. */}
      <div
        className="flex-1 flex justify-center p-4 sm:p-8 bg-[#EFEDE7]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(30, 58, 138, 0.055) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(30, 58, 138, 0.055) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <RecipeCard
          key={recipeData ? recipeData.sourceUrl : 'empty'}
          recipe={recipeData}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <Footer />
    </div>
  );
}
