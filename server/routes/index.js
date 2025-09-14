const express = require('express');
const router = express.Router();

// Import route modules
const homeRoutes = require('./home');
const recipeRoutes = require('./recipe');
const ingredientsRoutes = require('./ingredients');
const instructionsRoutes = require('./instructions');
const recipeMetadataRoutes = require('./recipe-metadata');

// Use routes
router.use('/', homeRoutes);
router.use('/api', recipeRoutes);
router.use('/api', ingredientsRoutes);
router.use('/api', instructionsRoutes);
router.use('/api', recipeMetadataRoutes);

module.exports = router; 