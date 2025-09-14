export const printRecipe = (recipeData) => {
    if (!recipeData) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Create a complete HTML document for printing
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${recipeData.title} - Recipe</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                }
                .recipe-card {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .recipe-header {
                    background: #f5f5f5;
                    padding: 20px;
                    border-bottom: 1px solid #ddd;
                }
                .recipe-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 10px;
                }
                .recipe-meta {
                    display: flex;
                    gap: 20px;
                    font-size: 14px;
                    color: #666;
                }
                .recipe-content {
                    display: flex;
                    padding: 20px;
                }
                .ingredients {
                    width: 30%;
                    padding-right: 20px;
                }
                .directions {
                    width: 70%;
                    padding-left: 20px;
                    border-left: 1px solid #ddd;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 15px;
                    text-align: center;
                    text-transform: uppercase;
                }
                .ingredient-item, .direction-item {
                    margin-bottom: 8px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #eee;
                }
                .ingredient-number, .direction-number {
                    font-weight: bold;
                    margin-right: 8px;
                }
                .recipe-footer {
                    background: white;
                    padding: 15px;
                    text-align: center;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #8B4513;
                    font-weight: bold;
                }
                @media print {
                    body { margin: 0; padding: 0; }
                    .recipe-card { box-shadow: none; border: 1px solid #000; }
                }
            </style>
        </head>
        <body>
            <div class="recipe-card">
                <div class="recipe-header">
                    <div class="recipe-title">${recipeData.title}</div>
                    <div class="recipe-meta">
                        <span>👥 SERVES: ${recipeData.serves}</span>
                        <span>⏱️ PREP TIME: ${recipeData.prepTime}</span>
                        <span>⏱️ COOK TIME: ${recipeData.cookTime}</span>
                    </div>
                </div>
                <div class="recipe-content">
                    <div class="ingredients">
                        <div class="section-title">Ingredients</div>
                        ${recipeData.ingredients.map((ingredient, index) => 
                            `<div class="ingredient-item">
                                <span class="ingredient-number">${index + 1}.</span>
                                ${ingredient}
                            </div>`
                        ).join('')}
                    </div>
                    <div class="directions">
                        <div class="section-title">Directions</div>
                        ${recipeData.directions.map((direction, index) => 
                            `<div class="direction-item">
                                <span class="direction-number">${index + 1}.</span>
                                ${direction}
                            </div>`
                        ).join('')}
                    </div>
                </div>
                <div class="recipe-footer">
                    WWW.GIVEMETHERECIPE.APP
                </div>
            </div>
        </body>
        </html>
    `;
    
    // Write the content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
    };
};
