import * as cheerio from 'cheerio';

/**
 * Recipe extraction engine.
 *
 * Given the raw HTML of a page, produce
 *     { title, serves, prepTime, cookTime, ingredients, instructions, source }
 *
 * Two layers, tried in order:
 *
 *   1. JSON-LD structured data (schema.org/Recipe). When a site publishes
 *      this, it is authoritative: the author has already sorted the content
 *      into buckets for us. We accept it whenever it yields both an
 *      ingredient list and an instruction list.
 *
 *   2. A DOM engine of the classic candidate → score → select shape
 *      (the same family of algorithm as Readability-style content
 *      extractors, specialized to two categories):
 *
 *        Pass 1  Candidate generation: every <ul>/<ol>, plus any container
 *                of repeated same-shaped children (div-based "lists").
 *        Pass 2  Scoring: each candidate gets an ingredient score and an
 *                instruction score from independent signals — the nearest
 *                preceding heading in document order, class/id/itemprop
 *                tokens, and the textual shape of its items.
 *        Pass 3  Selection: the best candidate per bucket anchors the
 *                recipe; the lowest common ancestor of the two winners is
 *                taken as the recipe container, and other qualifying
 *                candidates inside it are merged in document order (this
 *                is what stitches sectioned recipes — "For the sauce…" —
 *                back together, in order, without pulling in sidebars).
 *
 * Every pass is a single traversal, so the whole engine is O(N) in the
 * number of DOM nodes (plus O(items) for scoring).
 */

/* ================================================================== *
 *  Small utilities
 * ================================================================== */

/** Coerce a JSON-LD value (scalar | array | null) to an array. */
const asArray = (value) => (Array.isArray(value) ? value : value == null ? [] : [value]);

/** True iff a JSON-LD node's @type (string or array) includes `type`. */
const hasType = (node, type) =>
    asArray(node?.['@type']).some(
        (t) => typeof t === 'string' && t.toLowerCase() === type.toLowerCase()
    );

/**
 * Normalize a scrap of text pulled from either JSON-LD or the DOM:
 * strip tags and common entities, collapse whitespace, and remove
 * leading list-numbering / checkbox glyphs that sites bake into items.
 */
const cleanItemText = (text) =>
    String(text)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[▢□•◦*·]+\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim();

/** Deduplicate strings, preserving first-seen (i.e. document) order. */
const dedupe = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

/**
 * The first plausible duration phrase inside a scrap of text, or ''.
 * "Total Time40 minutes" → "40 minutes"; "Ready in 1 hour 20 mins" →
 * "1 hour 20 mins". This is the only thing the DOM metadata fallback is
 * allowed to return — never raw element text, which on some sites (NYT
 * Cooking) is an entire page section.
 */
const durationPhrase = (text) => {
    const match = String(text).match(
        /\d+\s*(?:hours?|hrs?)(?:\s*(?:and\s+)?\d+\s*(?:minutes?|mins?))?|\d+\s*(?:minutes?|mins?)\b/i
    );
    return match ? match[0].replace(/\s+/g, ' ').trim() : '';
};

/** A serving count, keeping ranges intact: "4 to 6 servings" → "4 to 6". */
const servingPhrase = (text) => {
    const match = String(text).match(/\d+\s*(?:(?:to|-|–)\s*\d+)?/);
    return match ? match[0].replace(/\s+/g, ' ').trim() : '';
};

/**
 * Render an ISO-8601 duration ("PT1H30M") as "1 hr 30 min".
 * Non-ISO input is returned untouched, so human-written times pass through.
 */
const formatDuration = (value) => {
    if (typeof value !== 'string') return '';
    const match = value.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
    if (!match || (!match[1] && !match[2] && !match[3])) return value.trim();
    const [, days, hours, minutes] = match;
    const parts = [];
    if (days) parts.push(`${days} day${days === '1' ? '' : 's'}`);
    if (hours) parts.push(`${hours} hr`);
    if (minutes) parts.push(`${minutes} min`);
    return parts.join(' ');
};

/* ================================================================== *
 *  Layer 1 — JSON-LD structured data
 * ================================================================== */

/**
 * Collect every schema.org/Recipe node on the page.
 *
 * Real-world JSON-LD comes in several wrappings that the naive
 * `data['@type'] === 'Recipe'` check misses: top-level arrays, nodes
 * nested under @graph (WordPress Recipe Maker, Yoast), and @type given
 * as an array like ["Recipe", "NewsArticle"]. All are handled here.
 */
function findJsonLdRecipes($) {
    const recipes = [];
    $('script[type="application/ld+json"]').each((_, script) => {
        let data;
        try {
            data = JSON.parse($(script).html());
        } catch {
            return; // malformed JSON-LD is common in the wild; skip it
        }
        const nodes = asArray(data).flatMap((node) =>
            node && node['@graph'] ? [node, ...asArray(node['@graph'])] : [node]
        );
        for (const node of nodes) {
            if (node && hasType(node, 'Recipe')) recipes.push(node);
        }
    });
    return recipes;
}

/**
 * Flatten schema.org recipeInstructions into an ordered list of steps.
 * Handles plain strings, HowToStep objects ({ text }), and HowToSection
 * groupings, whose steps live one level down in itemListElement.
 */
function flattenInstructions(value) {
    const steps = [];
    for (const node of asArray(value)) {
        if (typeof node === 'string') {
            const text = cleanItemText(node);
            if (text) steps.push(text);
        } else if (node && hasType(node, 'HowToSection')) {
            steps.push(...flattenInstructions(node.itemListElement));
        } else if (node && typeof node.text === 'string') {
            const text = cleanItemText(node.text);
            if (text) steps.push(text);
        }
    }
    return steps;
}

/** Extract whatever a JSON-LD Recipe node offers; fields may be empty. */
function extractFromJsonLd(recipeNode) {
    const ingredients = asArray(
        recipeNode.recipeIngredient ?? recipeNode.ingredients
    )
        .filter((item) => typeof item === 'string')
        .map(cleanItemText)
        .filter(Boolean);

    const instructions = flattenInstructions(recipeNode.recipeInstructions);

    const yieldValue = asArray(recipeNode.recipeYield)[0];

    return {
        title: typeof recipeNode.name === 'string' ? cleanItemText(recipeNode.name) : '',
        serves: yieldValue != null ? servingPhrase(yieldValue) : '',
        prepTime: formatDuration(recipeNode.prepTime ?? ''),
        // Sites that publish only a total time still deserve a time on the
        // card; total is a truthful upper bound for cook time.
        cookTime: formatDuration(recipeNode.cookTime ?? recipeNode.totalTime ?? ''),
        ingredients,
        instructions,
    };
}

/* ================================================================== *
 *  Layer 2 — DOM engine: candidate → score → select
 * ================================================================== */

const INGREDIENT_HEADER = /ingredient/i;
const INSTRUCTION_HEADER = /instruction|direction|method|preparation|\bsteps?\b/i;
const INGREDIENT_ATTR = /ingredient/i;
const INSTRUCTION_ATTR = /instruction|direction|\bstep/i;

// Containers whose contents are never recipe content. "header" is
// deliberately absent: recipe sites use class="...header" on headings.
const JUNK_ATTR = /\bnav|menu|footer|sidebar|comment|social|share|breadcrumb|related|newsletter|promo/i;
const RECIPE_ATTR = /ingredient|instruction|direction|step|recipe/i;

// Textual shape of an ingredient: short, and leading with a quantity
// ("2 cups", "½ tsp") or containing a unit of measure.
const QUANTITY_START = /^([\d¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|one |two |three |half )/i;
const UNIT_WORD =
    /\b(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|grams?|g|kg|milliliters?|ml|liters?|cloves?|pinch|dash|sticks?|cans?|packets?|slices?|bunch)\b/i;

// Textual shape of an instruction: sentence-length and imperative-initial
// (or at least sentence-terminated).
const IMPERATIVE_START =
    /^(preheat|heat|mix|stir|add|combine|whisk|pour|place|put|remove|bake|cook|boil|simmer|bring|reduce|season|serve|slice|chop|dice|mince|drain|rinse|cover|let|rest|transfer|sprinkle|spread|grease|melt|beat|fold|knead|roll|cut|arrange|garnish|set|prepare|toss|blend|process|grill|roast|sear|fry|saute|sauté|flip|repeat|meanwhile|in a|using|once|when|while|divide|top|refrigerate|chill|freeze|cool|allow|return|continue|line|lightly|gently|carefully|working)/i;

const looksLikeIngredient = (text) =>
    text.length <= 150 && (QUANTITY_START.test(text) || UNIT_WORD.test(text));

const looksLikeInstruction = (text) =>
    text.length >= 30 &&
    text.split(/\s+/).length >= 6 &&
    (IMPERATIVE_START.test(text) || /[.!]$/.test(text));

// A candidate must clear this score to be considered at all. The signal
// weights below are chosen so that content shape alone (a fully
// quantity-shaped list, score 6) clears it, and a labeled list with
// mediocre content (4 + ~2) clears it, but an unlabeled list of
// arbitrary prose does not.
const ACCEPT_SCORE = 5;
const CONTENT_WEIGHT = 6;
const HEADER_WEIGHT = 4;
const ATTR_WEIGHT = 4;
const LINK_PENALTY = 6;

const MAX_INGREDIENTS = 50;
const MAX_INSTRUCTIONS = 40;

/** True iff `el` sits inside an element that is structurally junk (nav,
 *  footer, comments…), unless a recipe-ish class on the way up vouches
 *  for it. Walks the ancestor chain: O(depth). */
function isInsideJunk($, el) {
    for (let node = el; node && node.type !== 'root'; node = node.parent) {
        const $node = $(node);
        if ($node.is('nav, footer, aside, form')) return true;
        const attrs = `${$node.attr('class') || ''} ${$node.attr('id') || ''}`;
        if (JUNK_ATTR.test(attrs) && !RECIPE_ATTR.test(attrs)) return true;
    }
    return false;
}

/** Text of one item, with any nested lists removed so a section wrapper
 *  <li> doesn't swallow its own sub-list's text twice. */
function itemText($, itemEl) {
    const clone = $(itemEl).clone();
    clone.find('ul, ol').remove();
    return cleanItemText(clone.text());
}

/**
 * Pass 1 — candidate generation.
 *
 * A candidate is any structure that *could* be a recipe list:
 *   (a) every <ul>/<ol> (items = direct <li> children), and
 *   (b) every container with ≥ 3 same-shaped children (same tag, same
 *       class) — modern recipe plugins often render ingredients as
 *       repeated <div class="ingredient-row"> with no list markup at all.
 *
 * Candidates inside structural junk are rejected here, before scoring.
 */
function generateCandidates($) {
    const candidates = [];
    const claimed = new Set();

    const addCandidate = (rootEl, itemEls) => {
        if (claimed.has(rootEl)) return;
        const items = itemEls
            .map((el) => ({ el, text: itemText($, el) }))
            .filter((item) => item.text.length > 2);
        if (items.length < 2) return;
        claimed.add(rootEl);
        candidates.push({ node: rootEl, items, order: candidates.length });
    };

    $('ul, ol').each((_, list) => {
        if (isInsideJunk($, list)) return;
        addCandidate(list, $(list).children('li').toArray());
    });

    $('div, section').each((_, box) => {
        if (claimed.has(box) || isInsideJunk($, box)) return;
        const kids = $(box).children().toArray().filter((k) => k.type === 'tag');
        if (kids.length < 3) return;
        const tag = kids[0].name;
        if (tag !== 'div' && tag !== 'p') return;
        const shape = $(kids[0]).attr('class') || '';
        const uniform = kids.every(
            (k) => k.name === tag && ($(k).attr('class') || '') === shape
        );
        if (uniform) addCandidate(box, kids);
    });

    return candidates;
}

/**
 * Nearest-preceding-heading labeling: one pre-order walk of the document
 * assigns each candidate the text of the last heading seen before it.
 * Because the walk is in document order — not sibling order — this works
 * regardless of how deeply the list is nested inside wrapper divs, which
 * is precisely where the old sibling-walk approach lost recipes.
 */
function labelCandidatesWithHeadings($, candidates) {
    const byNode = new Map(candidates.map((c) => [c.node, c]));
    let lastHeading = '';
    $('*').each((_, el) => {
        const isHeadingTag = /^h[1-6]$/.test(el.name);
        const isHeadingClass =
            !isHeadingTag && /heading|title/i.test($(el).attr('class') || '');
        if (isHeadingTag || isHeadingClass) {
            const text = $(el).text().trim();
            if (text && text.length <= 80) lastHeading = text;
        }
        const candidate = byNode.get(el);
        if (candidate) candidate.heading = lastHeading;
    });
}

/** class + id + itemprop of a node and its nearest ancestors, as one
 *  searchable string. Three levels is enough to catch wrapper divs. */
function nearbyAttrs($, el) {
    const pieces = [];
    let node = el;
    for (let depth = 0; node && node.type !== 'root' && depth < 4; depth++, node = node.parent) {
        const $node = $(node);
        pieces.push($node.attr('class') || '', $node.attr('id') || '', $node.attr('itemprop') || '');
    }
    return pieces.join(' ');
}

/**
 * Pass 2 — scoring. Each candidate receives an independent score per
 * bucket; signals are additive so no single heuristic has veto power.
 */
function scoreCandidate($, candidate) {
    const texts = candidate.items.map((item) => item.text);
    const n = texts.length;

    let ingredientScore =
        (CONTENT_WEIGHT * texts.filter(looksLikeIngredient).length) / n;
    let instructionScore =
        (CONTENT_WEIGHT * texts.filter(looksLikeInstruction).length) / n;

    const heading = candidate.heading || '';
    if (INGREDIENT_HEADER.test(heading)) ingredientScore += HEADER_WEIGHT;
    if (INSTRUCTION_HEADER.test(heading)) instructionScore += HEADER_WEIGHT;

    const attrs = nearbyAttrs($, candidate.node);
    if (INGREDIENT_ATTR.test(attrs)) ingredientScore += ATTR_WEIGHT;
    if (INSTRUCTION_ATTR.test(attrs)) instructionScore += ATTR_WEIGHT;

    // Link-dominated items are navigation, not food.
    const linkDominated = candidate.items.filter(({ el, text }) => {
        const linkText = $(el).find('a').text().trim();
        return text.length > 0 && linkText.length > 0.7 * text.length;
    }).length;
    if (linkDominated / n > 0.5) {
        ingredientScore -= LINK_PENALTY;
        instructionScore -= LINK_PENALTY;
    }

    candidate.ingredientScore = ingredientScore;
    candidate.instructionScore = instructionScore;
}

/** Ancestor chain of a DOM node, self first. */
function ancestorChain(node) {
    const chain = [];
    for (let cur = node; cur; cur = cur.parent) chain.push(cur);
    return chain;
}

/** Lowest common ancestor of two DOM nodes — our estimate of the recipe
 *  container when we have both an ingredient and an instruction winner. */
function lowestCommonAncestor(a, b) {
    const ancestorsOfA = new Set(ancestorChain(a));
    for (let cur = b; cur; cur = cur.parent) {
        if (ancestorsOfA.has(cur)) return cur;
    }
    return null;
}

const isWithin = (node, container) =>
    container != null && ancestorChain(node).includes(container);

const isNested = (a, b) => isWithin(a.node, b.node) || isWithin(b.node, a.node);

/**
 * Pass 3 — selection for one bucket.
 *
 * Invariants of the accepted set:
 *   - every member clears ACCEPT_SCORE and scores higher for this bucket
 *     than for the other one (a candidate belongs to one bucket only);
 *   - members lie inside `scope` when a scope is known;
 *   - no member is an ancestor of another (no double-counted text);
 *   - members are in document order, so sectioned recipes read top to
 *     bottom exactly as the author wrote them.
 */
function selectBucket(candidates, scoreKey, otherKey, scope) {
    const accepted = [];
    for (const candidate of candidates) {
        // candidates arrive in document order (generation order)
        if (candidate[scoreKey] < ACCEPT_SCORE) continue;
        if (candidate[otherKey] > candidate[scoreKey]) continue;
        if (scope && !isWithin(candidate.node, scope)) continue;
        if (accepted.some((a) => isNested(a, candidate))) continue;
        accepted.push(candidate);
    }
    return dedupe(accepted.flatMap((c) => c.items.map((item) => item.text)));
}

/** Run the full DOM engine. Returns { ingredients, instructions }. */
function extractFromDom($) {
    const candidates = generateCandidates($);
    labelCandidatesWithHeadings($, candidates);
    candidates.forEach((candidate) => scoreCandidate($, candidate));

    const bestBy = (key) =>
        candidates.reduce(
            (best, c) => (c[key] >= ACCEPT_SCORE && (!best || c[key] > best[key]) ? c : best),
            null
        );
    const bestIngredient = bestBy('ingredientScore');
    const bestInstruction = bestBy('instructionScore');

    const scope =
        bestIngredient && bestInstruction
            ? lowestCommonAncestor(bestIngredient.node, bestInstruction.node)
            : null;

    return {
        ingredients: selectBucket(candidates, 'ingredientScore', 'instructionScore', scope),
        instructions: selectBucket(candidates, 'instructionScore', 'ingredientScore', scope),
    };
}

/* ================================================================== *
 *  DOM fallbacks for title and metadata
 * ================================================================== */

function extractTitleFromDom($) {
    const selectors = ['h1[class*="recipe"]', 'h1[class*="title"]', '.recipe-title', 'h1', 'title'];
    for (const selector of selectors) {
        const text = $(selector).first().text().trim();
        if (text) return text;
    }
    return '';
}

function extractMetadataFromDom($) {
    // Scan every element the selector matches (not just the first) and
    // accept only short, label-bearing text that yields a duration
    // phrase. The length guard skips elements like NYT Cooking's whole
    // "Preparation" section, whose class also contains "prep".
    const firstDuration = (selectors, mustContain) => {
        for (const selector of selectors) {
            let found = '';
            $(selector).each((_, el) => {
                if (found) return;
                const text = $(el).text().trim();
                if (text.length > 0 && text.length <= 100 && mustContain.test(text)) {
                    found = durationPhrase(text);
                }
            });
            if (found) return found;
        }
        return '';
    };

    let serves = '';
    $('[class*="serving"], [class*="yield"], [class*="portion"]').each((_, el) => {
        if (serves) return;
        const text = $(el).text().trim();
        if (text.length > 0 && text.length <= 100 && /serving|serves|portion|yield/i.test(text)) {
            serves = servingPhrase(text);
        }
    });

    return {
        serves,
        prepTime: firstDuration(['[class*="prep"]'], /prep/i),
        cookTime: firstDuration(['[class*="cook"]', '[class*="total"]'], /cook|bake|total/i),
    };
}

/* ================================================================== *
 *  Public entry point
 * ================================================================== */

/**
 * Extract a recipe from raw page HTML.
 *
 * Precondition:  `html` is a string (possibly of a non-recipe page).
 * Postcondition: returns an object with title/serves/prepTime/cookTime
 *   strings and ingredients/instructions arrays — arrays are empty, never
 *   undefined, when nothing was found. `source` records which layer
 *   produced the lists: 'json-ld' or 'dom'.
 */
export function extractRecipe(html) {
    const $ = cheerio.load(html);

    // Layer 1: accept structured data outright when it gives us both lists.
    const jsonLd = findJsonLdRecipes($).map(extractFromJsonLd);
    const complete = jsonLd.find((r) => r.ingredients.length > 0 && r.instructions.length > 0);
    const partial = jsonLd.find((r) => r.title || r.serves || r.prepTime || r.cookTime);

    const lists = complete
        ? { ingredients: complete.ingredients, instructions: complete.instructions }
        : extractFromDom($);

    // Title and metadata prefer structured data, then the DOM.
    const meta = extractMetadataFromDom($);
    const best = complete ?? partial ?? {};

    return {
        title: best.title || extractTitleFromDom($),
        serves: best.serves || meta.serves,
        prepTime: best.prepTime || meta.prepTime,
        cookTime: best.cookTime || meta.cookTime,
        ingredients: lists.ingredients.slice(0, MAX_INGREDIENTS),
        instructions: lists.instructions.slice(0, MAX_INSTRUCTIONS),
        source: complete ? 'json-ld' : 'dom',
    };
}
