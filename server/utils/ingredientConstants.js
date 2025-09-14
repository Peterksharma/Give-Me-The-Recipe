// Constants for ingredient extraction

// Header selectors to look for ingredient sections
exports.HEADER_SELECTORS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

// Fallback selectors if header method doesn't work
exports.FALLBACK_SELECTORS = [
    '[itemtype*="Recipe"] [itemprop="recipeIngredient"]',
    '.ingredients li',
    '.ingredient-list li',
    '.recipe-ingredients li'
];

// Words that indicate instruction text (should be filtered out)
exports.INSTRUCTION_WORDS = [
    'instructions', 'directions', 'method', 'preparation', 'steps',
    'thaw', 'freeze', 'bake', 'cook', 'preheat', 'oven', 'temperature',
    'minutes', 'hours', 'time', 'until', 'then', 'next', 'first',
    'remove', 'place', 'cover', 'let', 'wait', 'set', 'timer'
];

// Common ingredient words that help identify ingredients
exports.INGREDIENT_WORDS = [
    'butter', 'sugar', 'flour', 'salt', 'eggs', 'milk', 'oil', 'vanilla', 
    'chocolate', 'cheese', 'meat', 'vegetable', 'fruit', 'baking', 'powder', 'soda'
];

// Measurement units
exports.MEASUREMENT_UNITS = [
    'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
    'ounce', 'ounces', 'pound', 'pounds', 'gram', 'grams', 'ml', 'l'
];

// Unicode fractions
exports.UNICODE_FRACTIONS = ['½', '⅓', '⅔', '¼', '¾', '⅕', '⅖', '⅗', '⅘', '⅙', '⅚', '⅐', '⅛', '⅜', '⅝', '⅞'];

// Bullet point characters
exports.BULLET_CHARS = ['▢', '•', '*'];

// Maximum length for ingredient text (longer text is likely instructions)
exports.MAX_INGREDIENT_LENGTH = 100;

// Maximum number of ingredients to extract
exports.MAX_INGREDIENTS = 50; 