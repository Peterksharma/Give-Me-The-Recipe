const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const constants = require('../utils/ingredientConstants');
const utils = require('../utils/ingredientUtils');
const router = express.Router();

// Ingredient extraction endpoint
router.post('/extract-ingredients', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
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
            for (const headerSelector of constants.HEADER_SELECTORS) {
                const headers = $(headerSelector);
                
                headers.each((index, header) => {
                    const headerText = $(header).text().trim();
                    
                    // Check if header contains "ingredient" (case insensitive)
                    if (headerText.toLowerCase().includes('ingredient')) {
                        const listElement = utils.findListAfterHeader($, header);
                        
                        if (listElement.length > 0) {
                            const extractedIngredients = utils.extractIngredientsFromList($, listElement);
                            ingredients.push(...extractedIngredients);
                        }
                    }
                });
            }
            
            // If no ingredients found with header method, try fallback selectors
            if (ingredients.length === 0) {
                for (const selector of constants.FALLBACK_SELECTORS) {
                    const elements = $(selector);
                    if (elements.length > 0) {
                        const extractedIngredients = utils.extractIngredientsFromList($, elements);
                        ingredients.push(...extractedIngredients);
                        break;
                    }
                }
            }
        }
        
        // Clean and filter ingredients
        const cleanedIngredients = ingredients
            .map(ingredient => utils.cleanIngredientText(ingredient));
        
        const lengthFiltered = cleanedIngredients
            .filter(ingredient => ingredient.length > 2);
        
        const validFiltered = lengthFiltered
            .filter(ingredient => utils.isValidIngredient(ingredient));
        
        ingredients = validFiltered.slice(0, constants.MAX_INGREDIENTS);
        
        res.json({ 
            success: true, 
            message: 'Ingredients extracted successfully',
            url: url,
            ingredients: ingredients,
            count: ingredients.length
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to extract ingredients',
            details: error.message 
        });
    }
});

module.exports = router; 