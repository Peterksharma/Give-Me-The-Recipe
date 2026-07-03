/**
 * Print & share utilities for the recipe card.
 *
 * Printing follows a "largest size that still fits" rule. Whether the
 * recipe fits on one printed page is monotone in the font size, so a
 * simple descending scan suffices: try base sizes from LARGEST_PT down
 * to SMALLEST_PT (Word's size 12) and take the first that fits. If even
 * SMALLEST_PT overflows one page, readability beats page count: switch
 * to a sequential two-page layout at a comfortable TWO_PAGE_PT.
 *
 * Sharing sends the same content the print view renders, as plain
 * text — via the native share sheet where the Web Share API exists,
 * otherwise by copying to the clipboard.
 */

const LARGEST_PT = 15;   // preferred print size
const SMALLEST_PT = 12;  // never shrink below "Word size 12"
const TWO_PAGE_PT = 13;  // comfortable size once we concede a second page

// US Letter through 0.5in margins: printable area is 7.5in × 10in.
// CSS lays out print media at 96px/in.
const PAGE_WIDTH_IN = 7.5;
const PAGE_HEIGHT_PX = 10 * 96;

/** Escape text for safe interpolation into HTML. */
const escapeHtml = (text) =>
    String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const numberedList = (items, itemClass, numberClass) =>
    items
        .map(
            (item, index) =>
                `<div class="${itemClass}">
                    <span class="${numberClass}">${index + 1}.</span>
                    ${escapeHtml(item)}
                </div>`
        )
        .join('');

/**
 * Build the standalone HTML document used for printing.
 *
 * The document carries its own fitting script: on load it scans base
 * font sizes (see module docstring), then prints itself. All inner
 * sizes are in em so the whole card scales with one font-size on the
 * card element; the card width is pinned to the printable width so the
 * on-screen measurement wraps text exactly as the printer will.
 */
export const buildPrintDocument = (recipeData) => `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${escapeHtml(recipeData.title)} - Recipe</title>
        <style>
            @page {
                size: letter;
                margin: 0.5in;
            }
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: white;
            }
            .recipe-card {
                width: ${PAGE_WIDTH_IN}in;
                margin: 0 auto;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                box-sizing: border-box;
                font-size: ${LARGEST_PT}pt;
            }
            .recipe-header {
                background: #FAF6EC;
                padding: 1em;
                /* the classic index-card red top rule */
                border-bottom: 2px solid #D96C5F;
            }
            .recipe-title {
                font-size: 1.5em;
                font-weight: bold;
                color: #333;
                margin-bottom: 0.4em;
            }
            .recipe-meta {
                display: flex;
                gap: 1.5em;
                font-size: 0.85em;
                color: #666;
            }
            .recipe-content {
                display: flex;
                padding: 1em;
            }
            .ingredients {
                width: 35%;
                padding-right: 1em;
                box-sizing: border-box;
            }
            .directions {
                width: 65%;
                padding-left: 1em;
                border-left: 1px solid #ddd;
                box-sizing: border-box;
            }
            .section-title {
                font-size: 1.15em;
                font-weight: bold;
                color: #333;
                margin-bottom: 0.8em;
                text-align: center;
                text-transform: uppercase;
            }
            .ingredient-item, .direction-item {
                margin-bottom: 0.5em;
                padding-bottom: 0.5em;
                /* pale blue ruled lines, like the card on screen */
                border-bottom: 1px solid #C9DAEB;
                break-inside: avoid;
            }
            .ingredient-number, .direction-number {
                font-weight: bold;
                margin-right: 0.4em;
                color: #D96C5F;
            }
            .recipe-footer {
                background: white;
                padding: 0.8em;
                text-align: center;
                border-top: 1px solid #ddd;
                font-size: 0.75em;
                color: #8B4513;
                font-weight: bold;
            }
            /* Multi-page mode: sections flow sequentially in block layout,
               which fragments across pages far more reliably than flex.
               Ingredients are short lines, so they flow in two columns
               (multicol fragmentation is mature in every engine). */
            .recipe-card.two-page .recipe-content {
                display: block;
            }
            .recipe-card.two-page .ingredients,
            .recipe-card.two-page .directions {
                width: 100%;
                padding-left: 0;
                padding-right: 0;
                border-left: none;
            }
            .recipe-card.two-page .ingredient-list {
                columns: 2;
                column-gap: 2em;
            }
            .recipe-card.two-page .directions {
                margin-top: 1em;
            }
            @media print {
                .recipe-card { border-radius: 0; }
            }
        </style>
    </head>
    <body>
        <div class="recipe-card" id="card">
            <div class="recipe-header">
                <div class="recipe-title">${escapeHtml(recipeData.title)}</div>
                <div class="recipe-meta">
                    <span>&#128101; SERVES: ${escapeHtml(recipeData.serves)}</span>
                    <span>&#9201;&#65039; PREP TIME: ${escapeHtml(recipeData.prepTime)}</span>
                    <span>&#9201;&#65039; COOK TIME: ${escapeHtml(recipeData.cookTime)}</span>
                </div>
            </div>
            <div class="recipe-content">
                <div class="ingredients">
                    <div class="section-title">Ingredients</div>
                    <div class="ingredient-list">
                        ${numberedList(recipeData.ingredients, 'ingredient-item', 'ingredient-number')}
                    </div>
                </div>
                <div class="directions">
                    <div class="section-title">Directions</div>
                    ${numberedList(recipeData.directions, 'direction-item', 'direction-number')}
                </div>
            </div>
            <div class="recipe-footer">
                WWW.GIVEMETHERECIPE.APP
            </div>
        </div>
        <script>
            (function () {
                var card = document.getElementById('card');

                // Largest base size in [SMALLEST, LARGEST] that fits one
                // page; null if none does. Fitting is monotone in size,
                // so the first success of the descending scan is optimal.
                function fitToOnePage() {
                    for (var size = ${LARGEST_PT}; size >= ${SMALLEST_PT}; size -= 0.5) {
                        card.style.fontSize = size + 'pt';
                        if (card.offsetHeight <= ${PAGE_HEIGHT_PX}) return size;
                    }
                    return null;
                }

                window.addEventListener('load', function () {
                    if (fitToOnePage() === null) {
                        card.classList.add('two-page');
                        card.style.fontSize = '${TWO_PAGE_PT}pt';
                    }
                    window.print();
                    window.close();
                });
            })();
        <\/script>
    </body>
    </html>
`;

export const printRecipe = (recipeData) => {
    if (!recipeData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return; // popup blocked
    printWindow.document.write(buildPrintDocument(recipeData));
    printWindow.document.close();
};

/**
 * Deep link that reopens this recipe in the app, so a share recipient
 * sees the same card the sender saw.
 */
export const buildRecipeLink = (sourceUrl) =>
    sourceUrl
        ? `${window.location.origin}/?recipe=${encodeURIComponent(sourceUrl)}`
        : window.location.origin;

/** The recipe as plain text, mirroring the print layout's content. */
export const buildShareText = (recipeData) => {
    const lines = [
        recipeData.title,
        `Serves: ${recipeData.serves} | Prep: ${recipeData.prepTime} | Cook: ${recipeData.cookTime}`,
        '',
        'INGREDIENTS',
        ...recipeData.ingredients.map((item, i) => `${i + 1}. ${item}`),
        '',
        'DIRECTIONS',
        ...recipeData.directions.map((item, i) => `${i + 1}. ${item}`),
    ];
    return lines.join('\n');
};

/**
 * Share the recipe (content plus a deep link back to this card).
 * Returns how it was delivered so the UI can give feedback: 'shared'
 * (native share sheet), 'copied' (clipboard fallback), or 'cancelled'
 * (user dismissed the share sheet).
 */
export const shareRecipe = async (recipeData) => {
    if (!recipeData) return 'cancelled';
    const text = buildShareText(recipeData);
    const link = buildRecipeLink(recipeData.sourceUrl);

    if (typeof navigator !== 'undefined' && navigator.share) {
        try {
            await navigator.share({ title: recipeData.title, text, url: link });
            return 'shared';
        } catch (error) {
            if (error.name === 'AbortError') return 'cancelled';
            // fall through to the clipboard on any other failure
        }
    }

    await navigator.clipboard.writeText(`${text}\n\nSee the card: ${link}`);
    return 'copied';
};
