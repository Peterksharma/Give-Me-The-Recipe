import axios from 'axios';
import * as cheerio from 'cheerio';

// Constants
const HEADER_SELECTORS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    '[class*="heading"]',
    '[class*="title"]',
    '[class*="header"]'
];

const FALLBACK_SELECTORS = [
    'ol li',
    'ul li',
    '[class*="instruction"]',
    '[class*="step"]',
    '[class*="direction"]',
    '.instructions li',
    '.steps li',
    '.directions li'
];

const MIN_INSTRUCTION_LENGTH = 10;
const MAX_INSTRUCTIONS = 20;

// Utility functions
const extractInstructionsFromStructuredData = ($) => {
    const instructions = [];
    try {
        const scriptTags = $('script[type="application/ld+json"]');
        scriptTags.each((index, script) => {
            try {
                const data = JSON.parse($(script).html());
                if (data['@type'] === 'Recipe' && data.recipeInstructions) {
                    if (Array.isArray(data.recipeInstructions)) {
                        data.recipeInstructions.forEach(instruction => {
                            if (typeof instruction === 'string' && instruction.trim()) {
                                instructions.push(instruction.trim());
                            } else if (instruction.text) {
                                instructions.push(instruction.text.trim());
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
    return instructions;
};

const isInstructionHeader = (headerText) => {
    const lowerText = headerText.toLowerCase();
    return lowerText.includes('instruction') || 
           lowerText.includes('direction') || 
           lowerText.includes('step') || 
           lowerText.includes('method') ||
           lowerText.includes('preparation');
};

const findInstructionsAfterHeader = ($, header) => {
    let currentElement = $(header).next();
    
    // Look for the next list or div element
    while (currentElement.length > 0) {
        if (currentElement.is('ol, ul, div')) {
            return currentElement;
        }
        currentElement = currentElement.next();
    }
    
    return $();
};

const extractInstructionsFromList = ($, instructionElement) => {
    const instructions = [];
    instructionElement.find('li, p').each((index, element) => {
        const text = $(element).text().trim();
        if (text) {
            instructions.push(text);
        }
    });
    return instructions;
};

const cleanInstructionText = (instruction) => {
    return instruction
        .replace(/\s+/g, ' ')
        .replace(/^\d+\.\s*/, '')
        .trim();
};

const removeCSSGeneratedContent = (instruction) => {
    return instruction
        .replace(/::before|::after/g, '')
        .trim();
};

const isValidInstruction = (instruction) => {
    const lowerInstruction = instruction.toLowerCase();
    const invalidWords = ['ingredients', 'nutrition', 'serves', 'prep time', 'cook time'];
    return !invalidWords.some(word => lowerInstruction.includes(word)) && instruction.length >= MIN_INSTRUCTION_LENGTH;
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
        let instructions = [];
        
        // First, try to extract from structured data (JSON-LD)
        instructions = extractInstructionsFromStructuredData($);
        
        if (instructions.length === 0) {
            // Look for header tags containing instruction-related words
            for (const headerSelector of HEADER_SELECTORS) {
                const headers = $(headerSelector);
                
                headers.each((index, header) => {
                    const headerText = $(header).text().trim();
                    
                    // Check if header contains instruction-related words
                    if (isInstructionHeader(headerText)) {
                        const instructionElement = findInstructionsAfterHeader($, header);
                        
                        if (instructionElement.length > 0) {
                            const extractedInstructions = extractInstructionsFromList($, instructionElement);
                            instructions.push(...extractedInstructions);
                        }
                    }
                });
            }
            
            // If no instructions found with header method, try fallback selectors
            if (instructions.length === 0) {
                for (const selector of FALLBACK_SELECTORS) {
                    const elements = $(selector);
                    if (elements.length > 0) {
                        const extractedInstructions = extractInstructionsFromList($, elements);
                        instructions.push(...extractedInstructions);
                        break;
                    }
                }
            }
            
            // Additional fallback: Look for any paragraph or div that might contain instructions
            if (instructions.length === 0) {
                const paragraphs = $('p, div');
                const potentialInstructions = [];
                
                paragraphs.each((index, element) => {
                    const text = $(element).text().trim();
                    if (text.length > 50 && text.length < 500) {
                        // Check if it looks like an instruction
                        const lowerText = text.toLowerCase();
                        if (lowerText.includes('preheat') || 
                            lowerText.includes('combine') || 
                            lowerText.includes('prepare') || 
                            lowerText.includes('season') || 
                            lowerText.includes('sear') || 
                            lowerText.includes('roast') || 
                            lowerText.includes('rest') || 
                            lowerText.includes('slice') ||
                            lowerText.includes('serve')) {
                            potentialInstructions.push(text);
                        }
                    }
                });
                
                // Take the first 10 potential instructions
                instructions = potentialInstructions.slice(0, 10);
            }
        }
        
        // Clean and filter instructions
        const cleanedInstructions = instructions
            .map(instruction => cleanInstructionText(instruction))
            .map(instruction => removeCSSGeneratedContent(instruction));
        
        const lengthFiltered = cleanedInstructions
            .filter(instruction => instruction.length >= MIN_INSTRUCTION_LENGTH);
        
        const validFiltered = lengthFiltered
            .filter(instruction => isValidInstruction(instruction));
        
        instructions = validFiltered.slice(0, MAX_INSTRUCTIONS);
        
        return Response.json({ 
            success: true, 
            message: 'Instructions extracted successfully',
            url: url,
            instructions: instructions,
            count: instructions.length
        });
        
    } catch (error) {
        return Response.json({ 
            error: 'Failed to extract instructions',
            details: error.message 
        }, { status: 500 });
    }
}
