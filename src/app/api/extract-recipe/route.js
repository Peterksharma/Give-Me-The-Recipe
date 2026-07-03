import { gotScraping } from 'got-scraping';
import { extractRecipe } from '@/utils/recipeExtractor';

/**
 * POST /api/extract-recipe
 *
 * Fetches the given URL once and returns the complete extracted recipe:
 * { title, serves, prepTime, cookTime, ingredients, instructions, source }.
 * The extraction itself lives in src/utils/recipeExtractor.js.
 *
 * The page is fetched with got-scraping rather than a plain HTTP client:
 * it impersonates a real browser's TLS fingerprint and header ordering,
 * which is what large recipe publishers (AllRecipes, Budget Bytes, …)
 * fingerprint to reject non-browser requests.
 */
export async function POST(request) {
    const { url } = await request.json().catch(() => ({}));

    if (!url) {
        return Response.json({ error: 'URL is required' }, { status: 400 });
    }
    try {
        new URL(url);
    } catch {
        return Response.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        const response = await gotScraping({
            url,
            timeout: { request: 20000 },
            retry: { limit: 1 },
        });

        const recipe = extractRecipe(response.body);

        if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
            return Response.json(
                { error: 'Could not find a recipe on that page' },
                { status: 422 }
            );
        }

        return Response.json({ success: true, url, ...recipe });
    } catch (error) {
        // Distinguish "the site refused us" from a genuine server bug, so
        // the client can show an actionable message.
        const status = error.response?.statusCode;
        if (status) {
            const blocked = status === 403 || status === 429;
            return Response.json(
                {
                    error: blocked
                        ? 'That site is blocking automated access (HTTP ' + status + ')'
                        : 'That site responded with HTTP ' + status,
                },
                { status: 502 }
            );
        }
        if (error.name === 'TimeoutError') {
            return Response.json(
                { error: 'That site took too long to respond' },
                { status: 504 }
            );
        }
        return Response.json(
            { error: 'Failed to extract recipe', details: error.message },
            { status: 500 }
        );
    }
}
