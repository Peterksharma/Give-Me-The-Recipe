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
        
        let servingCount = '';
        let prepTime = '';
        let cookTime = '';
        
        // First, try to extract from structured data (JSON-LD)
        try {
            const scriptTags = $('script[type="application/ld+json"]');
            scriptTags.each((index, script) => {
                try {
                    const data = JSON.parse($(script).html());
                    if (data['@type'] === 'Recipe') {
                        if (data.recipeYield) {
                            // Extract just the number from recipeYield
                            const yieldValue = data.recipeYield.toString();
                            const numberMatch = yieldValue.match(/\d+/);
                            servingCount = numberMatch ? numberMatch[0] : yieldValue;
                        }
                        if (data.prepTime) {
                            prepTime = data.prepTime;
                        }
                        if (data.cookTime) {
                            cookTime = data.cookTime;
                        }
                    }
                } catch (error) {
                    // Silently handle JSON parsing errors
                }
            });
        } catch (error) {
            // Silently handle errors
        }
        
        // If not found in structured data, try common selectors
        if (!servingCount) {
            const servingSelectors = [
                '[class*="serving"]',
                '[class*="yield"]',
                '[class*="portion"]',
                '[data-testid*="serving"]',
                '[data-testid*="yield"]'
            ];
            
            for (const selector of servingSelectors) {
                const element = $(selector).first();
                if (element.length > 0) {
                    const text = element.text().trim();
                    if (text && (text.includes('serving') || text.includes('portion') || text.includes('yield'))) {
                        // Extract just the number from the text
                        const numberMatch = text.match(/\d+/);
                        servingCount = numberMatch ? numberMatch[0] : text;
                        break;
                    }
                }
            }
        }
        
        if (!prepTime) {
            const prepTimeSelectors = [
                '[class*="prep"]',
                '[class*="preparation"]',
                '[data-testid*="prep"]',
                'time[datetime*="PT"]'
            ];
            
            for (const selector of prepTimeSelectors) {
                const element = $(selector).first();
                if (element.length > 0) {
                    const text = element.text().trim();
                    if (text && (text.includes('prep') || text.includes('preparation'))) {
                        prepTime = text;
                        break;
                    }
                }
            }
        }
        
        if (!cookTime) {
            const cookTimeSelectors = [
                '[class*="cook"]',
                '[class*="bake"]',
                '[class*="total"]',
                '[data-testid*="cook"]',
                'time[datetime*="PT"]'
            ];
            
            for (const selector of cookTimeSelectors) {
                const element = $(selector).first();
                if (element.length > 0) {
                    const text = element.text().trim();
                    if (text && (text.includes('cook') || text.includes('bake') || text.includes('total'))) {
                        cookTime = text;
                        break;
                    }
                }
            }
        }
        
        // Clean up the extracted values
        const cleanTime = (timeStr) => {
            if (!timeStr) return '';
            // Remove PT prefix if present (ISO 8601 duration format)
            let cleaned = timeStr.replace(/^PT/, '');
            // Remove extra whitespace and normalize
            return cleaned.replace(/\s+/g, ' ').trim();
        };
        
        return Response.json({ 
            success: true, 
            message: 'Recipe metadata extracted successfully',
            url: url,
            metadata: {
                servingCount: servingCount || 'N/A',
                prepTime: cleanTime(prepTime) || 'N/A',
                cookTime: cleanTime(cookTime) || 'N/A'
            }
        });
        
    } catch (error) {
        return Response.json({ 
            error: 'Failed to extract recipe metadata',
            details: error.message 
        }, { status: 500 });
    }
}
