const utils = require('../../utils/ingredientUtils');

describe('Ingredient Utils Tests', () => {
  describe('isValidIngredient', () => {
    it('should validate valid ingredients', () => {
      const validIngredients = [
        '2 cups all-purpose flour',
        '1/2 cup sugar',
        '3 large eggs',
        '1 tablespoon olive oil',
        'Salt and pepper to taste',
        '1/4 teaspoon baking soda',
        '2 tablespoons unsalted butter'
      ];

      validIngredients.forEach(ingredient => {
        expect(utils.isValidIngredient(ingredient)).toBe(true);
      });
    });

    it('should reject non-ingredient text', () => {
      const invalidIngredients = [
        'Preheat oven to 350°F',
        'Mix ingredients together',
        'Bake for 25 minutes',
        'This post may contain affiliate links',
        'Nutrition information',
        'Servings: 4',
        'Prep time: 15 minutes'
      ];

      invalidIngredients.forEach(ingredient => {
        expect(utils.isValidIngredient(ingredient)).toBe(false);
      });
    });

    it('should handle unicode fractions', () => {
      const unicodeIngredients = [
        '½ cup milk',
        '⅓ cup oil',
        '¼ teaspoon salt',
        '¾ cup flour'
      ];

      unicodeIngredients.forEach(ingredient => {
        expect(utils.isValidIngredient(ingredient)).toBe(true);
      });
    });
  });

  describe('cleanIngredientText', () => {
    it('should remove leading numbers and bullets', () => {
      expect(utils.cleanIngredientText('1. 2 cups flour')).toBe('2 cups flour');
      expect(utils.cleanIngredientText('• 1 cup sugar')).toBe('1 cup sugar');
      expect(utils.cleanIngredientText('* 3 eggs')).toBe('3 eggs');
    });

    it('should normalize unicode fractions', () => {
      expect(utils.cleanIngredientText('½ cup milk')).toBe('1/2 cup milk');
      expect(utils.cleanIngredientText('⅓ cup oil')).toBe('1/3 cup oil');
      expect(utils.cleanIngredientText('¼ teaspoon salt')).toBe('1/4 teaspoon salt');
    });

    it('should clean extra whitespace', () => {
      expect(utils.cleanIngredientText('  2 cups  flour  ')).toBe('2 cups flour');
    });
  });

  describe('extractIngredientsFromList', () => {
    it('should extract ingredients from list elements', () => {
      const cheerio = require('cheerio');
      const html = `
        <ul>
          <li>2 cups flour</li>
          <li>1 cup sugar</li>
          <li>3 eggs</li>
        </ul>
      `;
      const $ = cheerio.load(html);
      const listElement = $('ul');

      const ingredients = utils.extractIngredientsFromList($, listElement);
      
      expect(ingredients).toHaveLength(3);
      expect(ingredients).toContain('2 cups flour');
      expect(ingredients).toContain('1 cup sugar');
      expect(ingredients).toContain('3 eggs');
    });

    it('should filter out non-ingredient text', () => {
      const cheerio = require('cheerio');
      const html = `
        <ul>
          <li>2 cups flour</li>
          <li>Preheat oven to 350°F</li>
          <li>1 cup sugar</li>
          <li>Mix ingredients together</li>
        </ul>
      `;
      const $ = cheerio.load(html);
      const listElement = $('ul');

      const ingredients = utils.extractIngredientsFromList($, listElement);
      
      expect(ingredients).toHaveLength(2);
      expect(ingredients).toContain('2 cups flour');
      expect(ingredients).toContain('1 cup sugar');
    });
  });

  describe('findListAfterHeader', () => {
    it('should find list after header', () => {
      const cheerio = require('cheerio');
      const html = `
        <h2>Ingredients</h2>
        <ul>
          <li>2 cups flour</li>
          <li>1 cup sugar</li>
        </ul>
      `;
      const $ = cheerio.load(html);
      const header = $('h2').first();

      const listElement = utils.findListAfterHeader($, header);
      
      expect(listElement.length).toBe(1);
      expect(listElement.find('li').length).toBe(2);
    });

    it('should handle nested structures', () => {
      const cheerio = require('cheerio');
      const html = `
        <div>
          <h2>Ingredients</h2>
          <div class="recipe-content">
            <ul>
              <li>2 cups flour</li>
            </ul>
          </div>
        </div>
      `;
      const $ = cheerio.load(html);
      const header = $('h2').first();

      const listElement = utils.findListAfterHeader($, header);
      
      expect(listElement.length).toBe(1);
      expect(listElement.find('li').length).toBe(1);
    });
  });
}); 