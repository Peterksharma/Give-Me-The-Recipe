"use client";
import { useState } from 'react';
import Header from '@/components/Header/Header';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  const [recipeData, setRecipeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRecipeExtract = async (url) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call all four API endpoints in parallel
      const [titleResponse, ingredientsResponse, instructionsResponse, metadataResponse] = await Promise.all([
        fetch('/api/extract-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        }),
        fetch('/api/extract-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        }),
        fetch('/api/extract-instructions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        }),
        fetch('/api/extract-recipe-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
      ]);

      const [titleData, ingredientsData, instructionsData, metadataData] = await Promise.all([
        titleResponse.json(),
        ingredientsResponse.json(),
        instructionsResponse.json(),
        metadataResponse.json()
      ]);

      // Check if any of the requests failed
      if (!titleData.success || !ingredientsData.success || !instructionsData.success || !metadataData.success) {
        throw new Error('Failed to extract recipe data');
      }

      // Combine the data into the format expected by RecipeCard
      const extractedRecipe = {
        title: titleData.title || 'Recipe Title',
        serves: metadataData.metadata?.servingCount || 'N/A',
        prepTime: metadataData.metadata?.prepTime || 'N/A',
        cookTime: metadataData.metadata?.cookTime || 'N/A',
        ingredients: ingredientsData.ingredients || [],
        directions: instructionsData.instructions || []
      };

      setRecipeData(extractedRecipe);
    } catch (err) {
      setError(err.message);
      console.error('Error extracting recipe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header onSearch={handleRecipeExtract} isLoading={isLoading} />

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        {/* Main Content - Recipe Card */}
        <div className="w-full">
          <RecipeCard recipe={recipeData} />
          {error && (
            <div className="text-center mt-4">
              <p className="text-red-600 bg-red-100 p-4 rounded-lg inline-block">
                Error: {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}