const express = require('express');
const path = require('path');
const router = express.Router();

// Home route - serve the Next.js application
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'out', 'index.html'));
});

// Fallback for Next.js routing - serve index.html for all non-API routes
router.get('*', (req, res) => {
    // Only serve the app for non-API routes
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', '..', 'client', 'out', 'index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

module.exports = router; 