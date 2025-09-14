const utils = require('../../utils/instructionUtils');

describe('Instruction Utils Tests', () => {
  describe('isValidInstruction', () => {
    it('should validate valid instructions', () => {
      const validInstructions = [
        'Preheat oven to 350°F (175°C)',
        'Mix flour, sugar, and salt in a large bowl',
        'Add eggs and milk, then whisk until smooth',
        'Bake for 25-30 minutes until golden brown',
        'Let cool for 10 minutes before serving',
        'Season with salt and pepper to taste',
        'Cook over medium heat for 5 minutes'
      ];

      validInstructions.forEach(instruction => {
        expect(utils.isValidInstruction(instruction)).toBe(true);
      });
    });

    it('should reject non-instruction text', () => {
      const invalidInstructions = [
        'This post may contain affiliate links',
        'Nutrition information per serving',
        'Servings: 4 people',
        'Prep time: 15 minutes',
        'Total time: 45 minutes',
        'Difficulty: Easy',
        'Advertisement'
      ];

      invalidInstructions.forEach(instruction => {
        expect(utils.isValidInstruction(instruction)).toBe(false);
      });
    });

    it('should handle context-aware filtering', () => {
      // Should allow "ingredients" in cooking context
      expect(utils.isValidInstruction('Add the dressing ingredients to the bowl')).toBe(true);
      expect(utils.isValidInstruction('Mix all ingredients together')).toBe(true);
      
      // Should allow "serving" in cooking context
      expect(utils.isValidInstruction('Serve immediately while hot')).toBe(true);
      expect(utils.isValidInstruction('Before serving, garnish with herbs')).toBe(true);
    });
  });

  describe('cleanInstructionText', () => {
    it('should remove step numbers and bullets', () => {
      expect(utils.cleanInstructionText('1. Preheat oven to 350°F')).toBe('Preheat oven to 350°F');
      expect(utils.cleanInstructionText('Step 2: Mix ingredients')).toBe('Mix ingredients');
      expect(utils.cleanInstructionText('• Add flour to bowl')).toBe('Add flour to bowl');
      expect(utils.cleanInstructionText('* Whisk until smooth')).toBe('Whisk until smooth');
    });

    it('should remove CSS-generated content', () => {
      expect(utils.cleanInstructionText('1. Preheat oven to 350°F')).toBe('Preheat oven to 350°F');
      expect(utils.cleanInstructionText('Step 3: Bake for 25 minutes')).toBe('Bake for 25 minutes');
    });

    it('should preserve measurements and cooking content', () => {
      expect(utils.cleanInstructionText('Cook for 5 minutes over medium heat')).toBe('Cook for 5 minutes over medium heat');
      expect(utils.cleanInstructionText('Add 1/2 cup of milk')).toBe('Add 1/2 cup of milk');
      expect(utils.cleanInstructionText('Bake at 350°F for 25-30 minutes')).toBe('Bake at 350°F for 25-30 minutes');
    });
  });

  describe('extractInstructionsFromStructuredData', () => {
    it('should extract instructions from JSON-LD', () => {
      const cheerio = require('cheerio');
      const html = `
        <html>
          <body>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "recipeInstructions": [
                  {
                    "@type": "HowToStep",
                    "text": "Preheat oven to 350°F"
                  },
                  {
                    "@type": "HowToStep",
                    "text": "Mix ingredients together"
                  },
                  {
                    "@type": "HowToStep",
                    "text": "Bake for 25 minutes"
                  }
                ]
              }
            </script>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);

      const instructions = utils.extractInstructionsFromStructuredData($);
      
      expect(instructions).toHaveLength(3);
      expect(instructions).toContain('Preheat oven to 350°F');
      expect(instructions).toContain('Mix ingredients together');
      expect(instructions).toContain('Bake for 25 minutes');
    });

    it('should handle string instructions', () => {
      const cheerio = require('cheerio');
      const html = `
        <html>
          <body>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "recipeInstructions": "Preheat oven to 350°F. Mix ingredients together. Bake for 25 minutes."
              }
            </script>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);

      const instructions = utils.extractInstructionsFromStructuredData($);
      
      expect(instructions).toHaveLength(1);
      expect(instructions[0]).toBe('Preheat oven to 350°F. Mix ingredients together. Bake for 25 minutes.');
    });
  });

  describe('extractInstructionsFromList', () => {
    it('should extract instructions from wprm-recipe-instruction format', () => {
      const cheerio = require('cheerio');
      const html = `
        <div class="wprm-recipe-instruction-group">
          <ul class="wprm-recipe-instructions">
            <li class="wprm-recipe-instruction">
              <div class="wprm-recipe-instruction-text">
                <span>Preheat your oven to 325°F (163°C)</span>
              </div>
            </li>
            <li class="wprm-recipe-instruction">
              <div class="wprm-recipe-instruction-text">
                <span>Combine the seasoning rub</span>
              </div>
            </li>
            <li class="wprm-recipe-instruction">
              <div class="wprm-recipe-instruction-text">
                <span>Prepare the pork loin</span>
              </div>
            </li>
          </ul>
        </div>
      `;
      const $ = cheerio.load(html);
      const listElement = $('.wprm-recipe-instruction-group');

      const instructions = utils.extractInstructionsFromList($, listElement);
      
      expect(instructions).toHaveLength(3);
      expect(instructions).toContain('Preheat your oven to 325°F (163°C)');
      expect(instructions).toContain('Combine the seasoning rub');
      expect(instructions).toContain('Prepare the pork loin');
    });

    it('should filter out ads and non-instruction content', () => {
      const cheerio = require('cheerio');
      const html = `
        <div class="wprm-recipe-instruction-group">
          <ul class="wprm-recipe-instructions">
            <li class="wprm-recipe-instruction">
              <div class="wprm-recipe-instruction-text">
                <span>Preheat your oven to 325°F</span>
              </div>
            </li>
            <div class="adthrive-ad">Advertisement</div>
            <li class="wprm-recipe-instruction">
              <div class="wprm-recipe-instruction-text">
                <span>Combine the seasoning rub</span>
              </div>
            </li>
          </ul>
        </div>
      `;
      const $ = cheerio.load(html);
      const listElement = $('.wprm-recipe-instruction-group');

      const instructions = utils.extractInstructionsFromList($, listElement);
      
      expect(instructions).toHaveLength(2);
      expect(instructions).toContain('Preheat your oven to 325°F');
      expect(instructions).toContain('Combine the seasoning rub');
    });
  });

  describe('isInstructionHeader', () => {
    it('should identify instruction headers', () => {
      const instructionHeaders = [
        'Instructions',
        'Directions',
        'Method',
        'Preparation',
        'Steps',
        'How to make',
        'Cooking Instructions'
      ];

      instructionHeaders.forEach(header => {
        expect(utils.isInstructionHeader(header)).toBe(true);
      });
    });

    it('should reject non-instruction headers', () => {
      const nonInstructionHeaders = [
        'Ingredients',
        'Nutrition',
        'Notes',
        'Tips',
        'Storage',
        'Servings',
        'Prep Time'
      ];

      nonInstructionHeaders.forEach(header => {
        expect(utils.isInstructionHeader(header)).toBe(false);
      });
    });
  });
}); 