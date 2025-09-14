const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const constants = require('../utils/instructionConstants');
const utils = require('../utils/instructionUtils');
const router = express.Router();

// Instruction extraction endpoint
router.post('/extract-instructions', async (req, res) => {
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
        let instructions = [];
        
        // First, try to extract from structured data (JSON-LD)
        instructions = utils.extractInstructionsFromStructuredData($);
        
        if (instructions.length === 0) {
            // Look for header tags containing instruction-related words
            for (const headerSelector of constants.HEADER_SELECTORS) {
                const headers = $(headerSelector);
                
                headers.each((index, header) => {
                    const headerText = $(header).text().trim();
                    
                    // Check if header contains instruction-related words
                    if (utils.isInstructionHeader(headerText)) {
                        const instructionElement = utils.findInstructionsAfterHeader($, header);
                        
                        if (instructionElement.length > 0) {
                            const extractedInstructions = utils.extractInstructionsFromList($, instructionElement);
                            instructions.push(...extractedInstructions);
                        }
                    }
                });
            }
            
            // If no instructions found with header method, try fallback selectors
            if (instructions.length === 0) {
                for (const selector of constants.FALLBACK_SELECTORS) {
                    const elements = $(selector);
                    if (elements.length > 0) {
                        const extractedInstructions = utils.extractInstructionsFromList($, elements);
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
            .map(instruction => utils.cleanInstructionText(instruction))
            .map(instruction => utils.removeCSSGeneratedContent(instruction)); // Additional CSS cleaning
        
        const lengthFiltered = cleanedInstructions
            .filter(instruction => instruction.length >= constants.MIN_INSTRUCTION_LENGTH);
        
        const validFiltered = lengthFiltered
            .filter(instruction => utils.isValidInstruction(instruction));
        
        instructions = validFiltered.slice(0, constants.MAX_INSTRUCTIONS);
        
        res.json({ 
            success: true, 
            message: 'Instructions extracted successfully',
            url: url,
            instructions: instructions,
            count: instructions.length
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to extract instructions',
            details: error.message 
        });
    }
});

module.exports = router; 