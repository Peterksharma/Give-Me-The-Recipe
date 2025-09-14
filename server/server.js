const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

// Import routes
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Request counter for monitoring
let requestCounter = 0;
let recipeExtractionCounter = 0;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Set proper MIME types for ES6 modules
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    next();
});

// Serve static files from Next.js build output
app.use(express.static(path.join(__dirname, '..', 'client', 'out')));

// Request logging middleware
app.use((req, res, next) => {
    // Only count recipe extraction requests, not individual API calls
    if (req.path === '/api/extract-recipe') {
        recipeExtractionCounter++;
        console.log(`[${new Date().toISOString()}] Recipe Extraction is at ${recipeExtractionCounter} requests`);
    }
    next();
});

// Use routes
app.use('/', routes);

// Start server only in development (not in Vercel production or testing)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app; 