// Constants for instruction extraction

// Header selectors to look for instruction sections
exports.HEADER_SELECTORS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

// Fallback selectors if header method doesn't work
exports.FALLBACK_SELECTORS = [
    '.wprm-recipe-instruction .wprm-recipe-instruction-text',
    '[itemtype*="Recipe"] [itemprop="recipeInstructions"]',
    '.instructions li',
    '.instruction-list li',
    '.recipe-instructions li',
    '.directions li',
    '.method li',
    '.steps li'
];

// Words that indicate instruction sections (should be included)
exports.INSTRUCTION_HEADER_WORDS = [
    'instructions', 'directions', 'method', 'preparation', 'steps', 'how to'
];

// Words that indicate non-instruction text (should be filtered out)
exports.NON_INSTRUCTION_WORDS = [
    'nutrition', 'calories', 'protein', 'fat', 'carbohydrates',
    'prep time', 'cook time', 'total time', 'yield', 'serves', 'difficulty',
    'affiliate links', 'disclosure policy', 'this post may contain', 'please read our',
    'advertisement', 'sponsored', 'promotion', 'commercial', 'serving size', 'servings per'
];

// Common instruction action words that help identify instructions
exports.INSTRUCTION_ACTION_WORDS = [
    'preheat', 'mix', 'combine', 'add', 'stir', 'beat', 'whisk', 'fold', 'pour',
    'bake', 'cook', 'heat', 'simmer', 'boil', 'fry', 'grill', 'roast', 'place',
    'remove', 'cool', 'serve', 'garnish', 'sprinkle', 'drizzle', 'spread',
    'roll', 'cut', 'slice', 'chop', 'dice', 'mince', 'grate', 'peel', 'lower'
];

// Maximum length for instruction text (shorter text might be incomplete)
exports.MIN_INSTRUCTION_LENGTH = 10;

// Maximum number of instructions to extract
exports.MAX_INSTRUCTIONS = 50;

// Minimum number of words for a valid instruction
exports.MIN_WORDS_PER_INSTRUCTION = 3; 