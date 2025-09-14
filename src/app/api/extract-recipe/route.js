import axios from 'axios';
import * as cheerio from 'cheerio';

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
        
        // Try to extract recipe title from various common selectors
        let recipeTitle = '';
        
        // Common recipe title selectors
        const titleSelectors = [
            'h1[class*="recipe"]',
            'h1[class*="title"]',
            '.recipe-title',
            '.recipe-name',
            'h1',
            'title'
        ];
        
        for (const selector of titleSelectors) {
            const titleElement = $(selector).first();
            if (titleElement.length > 0) {
                recipeTitle = titleElement.text().trim();
                if (recipeTitle) {
                    break;
                }
            }
        }
        
        // If no title found, use the page title
        if (!recipeTitle) {
            recipeTitle = $('title').text().trim();
        }
        
        return Response.json({ 
            success: true, 
            message: 'Recipe title extracted successfully',
            url: url,
            title: recipeTitle
        });
        
    } catch (error) {
        return Response.json({ 
            error: 'Failed to extract recipe title',
            details: error.message 
        }, { status: 500 });
    }
}
