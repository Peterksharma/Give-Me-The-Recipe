const constants = require('./instructionConstants');

/**
 * Checks if a text string is likely to be a valid instruction
 * @param {string} text - The text to validate
 * @returns {boolean} - True if likely an instruction
 */
function isValidInstruction(text) {
    const lowerText = text.toLowerCase();
    
    // Skip if it contains non-instruction words (but be more context-aware)
    for (const word of constants.NON_INSTRUCTION_WORDS) {
        if (lowerText.includes(word)) {
            // Special handling for "ingredients" - only block if it's a header, not in cooking context
            if (word === 'ingredients') {
                // Allow "ingredients" if it's part of cooking instructions (like "dressing ingredients")
                if (lowerText.includes('dressing ingredients') || 
                    lowerText.includes('following ingredients') ||
                    lowerText.includes('remaining ingredients') ||
                    lowerText.includes('all ingredients')) {
                    continue; // Skip this check, allow the instruction
                }
                // Only block if it's a standalone "ingredients" header
                if (/^ingredients$|^ingredients:$|^ingredients\s*$/i.test(text.trim())) {
                    console.log(`[DEBUG] isValidInstruction: rejected "${text.substring(0, 50)}..." - standalone ingredients header`);
                    return false;
                }
            }
            
            // Special handling for "serving" - only block nutrition context
            if (word === 'serving') {
                // Allow "serving" if it's part of cooking instructions
                if (lowerText.includes('serve immediately') || 
                    lowerText.includes('serving any') ||
                    lowerText.includes('serving alongside') ||
                    lowerText.includes('before serving')) {
                    continue; // Skip this check, allow the instruction
                }
                // Only block if it's nutrition context
                if (lowerText.includes('serving size') || 
                    lowerText.includes('servings per') ||
                    lowerText.includes('per serving')) {
                    return false;
                }
            }
            
            return false;
        }
    }
    
    // Skip affiliate link patterns
    if (lowerText.includes('affiliate links') || 
        lowerText.includes('disclosure policy') ||
        lowerText.includes('this post may contain') ||
        lowerText.includes('please read our')) {
        return false;
    }
    
    // Skip advertisement patterns (but allow "add" as a cooking action)
    if (lowerText.includes('advertisement') || 
        lowerText.includes('sponsored') ||
        lowerText.includes('promotion') ||
        lowerText.includes('commercial') ||
        /\bad\b/.test(lowerText)) { // Word boundary to match "ad" but not "add"
        return false;
    }
    
    // Skip if it's too short (likely incomplete)
    if (text.length < constants.MIN_INSTRUCTION_LENGTH) {
        return false;
    }
    
    // Skip if it doesn't have enough words
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < constants.MIN_WORDS_PER_INSTRUCTION) {
        return false;
    }
    
    // More lenient validation - if it has reasonable length and contains cooking-related content, accept it
    const hasReasonableLength = text.length >= 20 && text.length <= 1000;
    const hasActionWords = constants.INSTRUCTION_ACTION_WORDS.some(word => lowerText.includes(word));
    const hasCookingWords = /(prepare|combine|mix|add|season|toss|drizzle|serve|whisk|bake|cook|heat|stir|beat|fold|pour|place|remove|cool|garnish|sprinkle)/i.test(text);
    const hasMeasurements = /\d+\/\d+|\d+\s+(cup|cups|tablespoon|teaspoon|ounce|pound|gram|minute|hour)/i.test(text);
    const hasPunctuation = /[.:]/.test(text);
    
    // Accept if it has reasonable length and at least one cooking indicator
    const isValid = hasReasonableLength && (hasActionWords || hasCookingWords || hasMeasurements || hasPunctuation);
    return isValid;
}

/**
 * Cleans instruction text by removing common prefixes and formatting
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
function cleanInstructionText(text) {
    return text
        .trim()
        .replace(/^Step\s+\d+\.?\s*:?\s*/i, '') // Remove "Step X:" or "Step X." from start
        .replace(/^\d+\.?\s*/, '') // Remove leading numbers and dots (step numbers)
        .replace(/^[•*]\s*/, '') // Remove leading bullet points
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/\s*\.$/, '') // Remove trailing period
        .replace(/\s*!$/, '') // Remove trailing exclamation
        .replace(/\s*\?$/, '') // Remove trailing question mark
        // More selective cleaning - only remove numbering patterns, not measurements
        .replace(/^\s*\d+\.?\s*$/, '') // Remove standalone numbers (like "1.", "2.")
        .replace(/^\s*\d+\.?\s*\d+\.?\s*$/, '') // Remove double numbers (like "21.", "42.")
        .replace(/\s+/g, ' ') // Clean up any extra spaces again
        .trim();
}

/**
 * Removes CSS-generated numbers and styling from instruction text
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
function removeCSSGeneratedContent(text) {
    return text
        // Only remove numbering patterns at the start, not measurements within text
        .replace(/^\s*\d+\.?\s*\d+\.?\s*/, '') // Remove patterns like "21.", "42." at start
        .replace(/^\s*\d+\.?\s*/, '') // Remove any remaining leading step numbers
        .replace(/^Step\s+\d+\.?\s*/i, '') // Remove "Step X" or "Step X." from start
        .replace(/\s+/g, ' ') // Clean up spaces
        .trim();
}

/**
 * Extracts instructions from JSON-LD structured data
 * @param {Object} $ - Cheerio object
 * @returns {Array} - Array of extracted instructions
 */
function extractInstructionsFromStructuredData($) {
    const instructions = [];
    
    // Look for JSON-LD script tags
    $('script[type="application/ld+json"]').each((index, script) => {
        try {
            const jsonData = JSON.parse($(script).html());
            
            // Handle single object or array of objects
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
            
            dataArray.forEach((data, dataIndex) => {
                // Check if this is a Recipe schema
                if (data['@type'] === 'Recipe' && data.recipeInstructions) {
                    if (Array.isArray(data.recipeInstructions)) {
                        // Handle array of instruction objects or strings
                        data.recipeInstructions.forEach((instruction, instIndex) => {
                            if (typeof instruction === 'string') {
                                instructions.push(instruction);
                            } else if (instruction['@type'] === 'HowToStep' && instruction.text) {
                                instructions.push(instruction.text);
                            }
                        });
                    } else if (typeof data.recipeInstructions === 'string') {
                        // Handle single string instruction
                        if (isValidInstruction(data.recipeInstructions)) {
                            instructions.push(data.recipeInstructions);
                        }
                    }
                }
            });
        } catch (error) {
            // Silently handle JSON parsing errors
        }
    });
    
    return instructions;
}

/**
 * Extracts instructions from a list element using cheerio
 * @param {Object} $ - Cheerio object
 * @param {Object} listElement - The list element to extract from
 * @returns {Array} - Array of extracted instructions
 */
function extractInstructionsFromList($, listElement) {
    const instructions = [];
    
    // First try to find wprm-recipe-instruction elements (specific to this recipe plugin)
    let instructionElements = listElement.find('.wprm-recipe-instruction .wprm-recipe-instruction-text');
    
    if (instructionElements.length === 0) {
        // Fallback to general li, p elements
        instructionElements = listElement.find('li, p');
    }
    
    instructionElements.each((index, element) => {
        // Get text content more carefully to avoid CSS pseudo-elements
        let text = '';
        
        // Try to get text from child nodes to avoid pseudo-elements
        $(element).contents().each((i, node) => {
            if (node.type === 'text') {
                text += $(node).text();
            } else if (node.type === 'tag' && node.name !== 'script' && node.name !== 'style') {
                text += $(node).text();
            }
        });
        
        text = text.trim();
        
        if (text && text.length > 2) {
            const isValid = isValidInstruction(text);
            if (isValid) {
                instructions.push(text);
            }
        }
    });
    return instructions;
}

/**
 * Finds the next list or paragraph element after a header
 * @param {Object} $ - Cheerio object
 * @param {Object} header - The header element
 * @returns {Object|null} - The found element or null
 */
function findInstructionsAfterHeader($, header) {
    // Look for the next sibling list or paragraph after this header
    let instructionElement = $(header).next('ul, ol, div, section');
    
    // If no immediate sibling, look for the next instruction section in the same parent
    if (instructionElement.length === 0) {
        instructionElement = $(header).parent().find('ul, ol, div, section').first();
    }
    
    // If still no element found, look for elements that come after this header in the document
    if (instructionElement.length === 0) {
        instructionElement = $(header).nextAll('ul, ol, div, section').first();
    }
    
    return instructionElement;
}

/**
 * Checks if a header contains instruction-related words
 * @param {string} headerText - The header text to check
 * @returns {boolean} - True if header is instruction-related
 */
function isInstructionHeader(headerText) {
    const lowerText = headerText.toLowerCase();
    return constants.INSTRUCTION_HEADER_WORDS.some(word => lowerText.includes(word));
}

module.exports = {
    isValidInstruction,
    cleanInstructionText,
    removeCSSGeneratedContent,
    extractInstructionsFromStructuredData,
    extractInstructionsFromList,
    findInstructionsAfterHeader,
    isInstructionHeader
}; 