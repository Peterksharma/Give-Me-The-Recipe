const constants = require('./ingredientConstants');

/**
 * Checks if a text string is likely to be a valid ingredient
 * @param {string} text - The text to validate
 * @returns {boolean} - True if likely an ingredient
 */
function isValidIngredient(text) {
    const lowerText = text.toLowerCase();
    
    // Skip if it contains instruction-related words
    for (const word of constants.INSTRUCTION_WORDS) {
        if (lowerText.includes(word)) {
            return false;
        }
    }
    
    // Skip if it's too long (likely instructions)
    if (text.length > constants.MAX_INGREDIENT_LENGTH) {
        return false;
    }
    
    // Skip if it contains sentence endings (likely instructions)
    if (text.includes('.') || text.includes('!') || text.includes('?')) {
        return false;
    }
    
    // Look for common ingredient patterns
    const ingredientPatterns = [
        // Regular measurements: "1 cup", "2 tablespoons"
        new RegExp(`\\d+\\s+(${constants.MEASUREMENT_UNITS.join('|')})`, 'i'),
        
        // Unicode fractions with measurements: "½ cup", "¾ teaspoon"
        new RegExp(`[${constants.UNICODE_FRACTIONS.join('')}]\\s*(${constants.MEASUREMENT_UNITS.join('|')})`, 'i'),
        
        // Regular fractions: "1/2", "3/4"
        /\d+\/\d+/,
        
        // Starts with number: "2 large eggs"
        /^\d+\s+/,
        
        // Starts with bullet and number: "▢1 cup"
        new RegExp(`^[${constants.BULLET_CHARS.join('')}]\\s*\\d+`),
        
        // Starts with bullet and unicode fraction: "▢½ teaspoon"
        new RegExp(`^[${constants.BULLET_CHARS.join('')}]\\s*[${constants.UNICODE_FRACTIONS.join('')}]`),
        
        // Contains ingredient words
        new RegExp(`(${constants.INGREDIENT_WORDS.join('|')})`, 'i')
    ];
    
    return ingredientPatterns.some(pattern => pattern.test(text));
}

/**
 * Cleans ingredient text by removing common prefixes and formatting
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
function cleanIngredientText(text) {
    return text
        .trim()
        .replace(/^\d+\.\s*/, '') // Remove leading numbers with dots (step numbers like "1. ")
        .replace(new RegExp(`^\\s*[${constants.BULLET_CHARS.join('')}]\\s*`), '') // Remove leading bullet points
        .replace(/½/g, '1/2') // Normalize unicode fractions
        .replace(/⅓/g, '1/3')
        .replace(/⅔/g, '2/3')
        .replace(/¼/g, '1/4')
        .replace(/¾/g, '3/4')
        .replace(/⅕/g, '1/5')
        .replace(/⅖/g, '2/5')
        .replace(/⅗/g, '3/5')
        .replace(/⅘/g, '4/5')
        .replace(/⅙/g, '1/6')
        .replace(/⅚/g, '5/6')
        .replace(/⅐/g, '1/7')
        .replace(/⅛/g, '1/8')
        .replace(/⅜/g, '3/8')
        .replace(/⅝/g, '5/8')
        .replace(/⅞/g, '7/8')
        .replace(/⅑/g, '1/9')
        .replace(/⅒/g, '1/10')
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/^\s+|\s+$/g, ''); // Trim whitespace
}

/**
 * Extracts ingredients from a list element using cheerio
 * @param {Object} $ - Cheerio object
 * @param {Object} listElement - The list element to extract from
 * @returns {Array} - Array of extracted ingredients
 */
function extractIngredientsFromList($, listElement) {
    const ingredients = [];
    
    const listItems = listElement.find('li');
    
    listItems.each((liIndex, li) => {
        const text = $(li).text().trim();
        
        if (text && text.length > 2) {
            const isValid = isValidIngredient(text);
            if (isValid) {
                ingredients.push(text);
            }
        }
    });
    
    return ingredients;
}

/**
 * Finds the next list element after a header
 * @param {Object} $ - Cheerio object
 * @param {Object} header - The header element
 * @returns {Object|null} - The found list element or null
 */
function findListAfterHeader($, header) {
    // Look for the next sibling list (ul or ol) after this header
    let listElement = $(header).next('ul, ol');
    
    // If no immediate sibling, look for the next list in the same parent
    if (listElement.length === 0) {
        listElement = $(header).parent().find('ul, ol').first();
    }
    
    // If still no list found, look for lists that come after this header in the document
    if (listElement.length === 0) {
        listElement = $(header).nextAll('ul, ol').first();
    }
    
    return listElement;
}

module.exports = {
    isValidIngredient,
    cleanIngredientText,
    extractIngredientsFromList,
    findListAfterHeader
}; 