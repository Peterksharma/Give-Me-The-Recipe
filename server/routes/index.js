const express = require('express');
const router = express.Router();

// Import route modules
const homeRoutes = require('./home');
const recipeRoutes = require('./recipe');
const ingredientsRoutes = require('./ingredients');
const instructionsRoutes = require('./instructions');

// Use routes
router.use('/', homeRoutes);
router.use('/api', recipeRoutes);
router.use('/api', ingredientsRoutes);
router.use('/api', instructionsRoutes);

module.exports = router; 