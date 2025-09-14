import axios from 'axios';
import * as cheerio from 'cheerio';

// Constants (moved from server utils)
const HEADER_SELECTORS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    '[class*="heading"]',
    '[class*="title"]',
    '[class*="header"]'
];

const FALLBACK_SELECTORS = [
    'ul li',
    'ol li',
    '[class*="ingredient"]',
    '[class*="recipe-ingredient"]',
    '.ingredients li',
    '.recipe-ingredients li'
];

const MAX_INGREDIENTS = 50;

// Utility functions
const findListAfterHeader = ($, header) => {
    let currentElement = $(header).next();
    
    // Look for the next list element
    while (currentElement.length > 0) {
        if (currentElement.is('ul, ol')) {
            return currentElement;
        }
        currentElement = currentElement.next();
    }
    
    return $();
};

const extractIngredientsFromList = ($, listElement) => {
    const ingredients = [];
    listElement.find('li').each((index, li) => {
        const text = $(li).text().trim();
        if (text) {
            ingredients.push(text);
        }
    });
    return ingredients;
};

const cleanIngredientText = (ingredient) => {
    return ingredient
        .replace(/\s+/g, ' ')
        .replace(/^\d+\.\s*/, '')
        .trim();
};

const isValidIngredient = (ingredient) => {
    const lowerIngredient = ingredient.toLowerCase();
    const invalidWords = ['instructions', 'directions', 'method', 'steps', 'preparation'];
    return !invalidWords.some(word => lowerIngredient.includes(word)) && ingredient.length > 2;
};

export async function POST(request) {
    try {
        const { url } = await request.json();
        
        if (!url) {
            return Response.json({ error: 'URL is required' }, { status: 400 });
        }
        
        // Fetch the webpage
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        let ingredients = [];
        
        // First, try to extract from structured data (JSON-LD)
        try {
            const scriptTags = $('script[type="application/ld+json"]');
            scriptTags.each((index, script) => {
                try {
                    const data = JSON.parse($(script).html());
                    if (data['@type'] === 'Recipe' && data.recipeIngredient) {
                        if (Array.isArray(data.recipeIngredient)) {
                            data.recipeIngredient.forEach(ingredient => {
                                if (typeof ingredient === 'string' && ingredient.trim()) {
                                    ingredients.push(ingredient.trim());
                                }
                            });
                        }
                    }
                } catch (error) {
                    // Silently handle JSON parsing errors
                }
            });
        } catch (error) {
            // Silently handle errors
        }
        
        // If we found ingredients from structured data, skip the header-based extraction
        if (ingredients.length === 0) {
            // If no ingredients found in structured data, look for header tags containing the word "Ingredient"
            for (const headerSelector of HEADER_SELECTORS) {
                const headers = $(headerSelector);
                
                headers.each((index, header) => {
                    const headerText = $(header).text().trim();
                    
                    // Check if header contains "ingredient" (case insensitive)
                    if (headerText.toLowerCase().includes('ingredient')) {
                        const listElement = findListAfterHeader($, header);
                        
                        if (listElement.length > 0) {
                            const extractedIngredients = extractIngredientsFromList($, listElement);
                            ingredients.push(...extractedIngredients);
                        }
                    }
                });
            }
            
            // If no ingredients found with header method, try fallback selectors
            if (ingredients.length === 0) {
                for (const selector of FALLBACK_SELECTORS) {
                    const elements = $(selector);
                    if (elements.length > 0) {
                        const extractedIngredients = extractIngredientsFromList($, elements);
                        ingredients.push(...extractedIngredients);
                        break;
                    }
                }
            }
        }
        
        // Clean and filter ingredients
        const cleanedIngredients = ingredients
            .map(ingredient => cleanIngredientText(ingredient));
        
        const lengthFiltered = cleanedIngredients
            .filter(ingredient => ingredient.length > 2);
        
        const validFiltered = lengthFiltered
            .filter(ingredient => isValidIngredient(ingredient));
        
        ingredients = validFiltered.slice(0, MAX_INGREDIENTS);
        
        return Response.json({ 
            success: true, 
            message: 'Ingredients extracted successfully',
            url: url,
            ingredients: ingredients,
            count: ingredients.length
        });
        
    } catch (error) {
        return Response.json({ 
            error: 'Failed to extract ingredients',
            details: error.message 
        }, { status: 500 });
    }
}