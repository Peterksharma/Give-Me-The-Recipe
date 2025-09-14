"use client";
import { UsersRound, Clock8, Printer } from "lucide-react";
import React from 'react';
import { useEffect, useState, useRef } from 'react';

export default function RecipeCard({ recipe = null }) {
    // Default placeholder data
    const defaultRecipe = {
        title: "Recipe Name",
        serves: "N/A",
        prepTime: "N/A",
        cookTime: "N/A",
        ingredients: [],
        directions: [
            "Enter the URL of the recipe you want to extract",
            "Click the \"Extract Recipe\" button",
            "The recipe ingredients and instructions will be extracted and displayed",
            "You can print the recipe",
            "Bon Appetit!"
        ]
    };

    const recipeData = recipe || defaultRecipe;
    const cardRef = useRef(null);
    const contentRef = useRef(null);

    // Calculate number of rows based on card's available content height
    const calculateRows = () => {
        if (!contentRef.current) return 10;
        
        const contentHeight = contentRef.current.clientHeight;
        const rowHeight = 40; // Height per row (h-6 + padding + border)
        const maxRows = Math.floor(contentHeight / rowHeight);
        return Math.max(5, Math.min(maxRows, 25)); // Minimum 5, maximum 25 rows
    };

    // Create fixed number of lines based on calculated rows
    const createLines = (items, count) => {
        const lines = [];
        for (let i = 0; i < count; i++) {
            lines.push(items[i] || ""); // Empty string if no content
        }
        return lines;
    };

    // Use a default row count, will be updated when card resizes
    const [rowCount, setRowCount] = useState(10);

    useEffect(() => {
        const updateRowCount = () => {
            setRowCount(calculateRows());
        };

        // Update on mount
        updateRowCount();
        
        // Use ResizeObserver to watch for card size changes
        const resizeObserver = new ResizeObserver(() => {
            updateRowCount();
        });

        if (cardRef.current) {
            resizeObserver.observe(cardRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const ingredientLines = createLines(recipeData.ingredients, rowCount);
    const directionLines = createLines(recipeData.directions, rowCount);

    return (
        <div ref={cardRef} className="w-[60vw] h-[60vh] mx-auto bg-white border border-gray-300 rounded-lg shadow-sm flex flex-col transition-all duration-300 hover:shadow-lg hover:border-gray-400">
            {/* Top Header Section */}
            <div className="bg-gray-100 px-6 py-4 flex items-center flex-shrink-0">
                <div className="text-7xl text-gray-700 font-bold text-center w-[30%]" style={{ fontFamily: 'Corinthia, cursive' }}>
                    Recipe
                </div>
                <div className="w-[70%] text-left pl-10">
                    <h2 className="text-2xl font-bold text-gray-700 uppercase tracking-wide">
                        {recipeData.title}
                    </h2>
                    <div className="flex space-x-10 mt-2 text-sm text-gray-600 justify-start">
                        <span className="flex items-center gap-1">
                            <UsersRound className="w-4 h-4" />
                            SERVES: {recipeData.serves}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock8 className="w-4 h-4" />
                            PREP TIME: {recipeData.prepTime}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock8 className="w-4 h-4" />
                            COOK TIME: {recipeData.cookTime}
                        </span>
                    </div>
                </div>
                <button className="p-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <Printer className="w-6 h-6" />
                </button>
            </div>

            {/* Horizontal separator line */}
            <div className="w-full h-px bg-gray-300 flex-shrink-0"></div>

            {/* Main Content Area */}
            <div ref={contentRef} className="px-6 py-6 flex-1 overflow-y-auto">
                <div className="flex h-full">
                    {/* Left Column - Ingredients (30%) */}
                    <div className="w-[30%] pr-4">
                        <h3 className="text-xl font-serif text-gray-700 mb-4 text-center uppercase">
                            Ingredients
                        </h3>
                        <div className="space-y-2">
                            {ingredientLines.map((ingredient, index) => (
                                <div key={index} className="border-b border-gray-200 pb-1 h-6">
                                    <div className="text-sm text-gray-600 leading-[.9rem] h-6 flex items-center" style={{ fontFamily: 'Gaegu, cursive' }}>
                                        {ingredient && (
                                            <span className="font-semibold text-gray-800 mr-2 min-w-[20px]">
                                                {index + 1}.
                                            </span>
                                        )}
                                        {ingredient}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vertical separator line */}
                    <div className="w-px bg-gray-300 mx-4"></div>

                    {/* Right Column - Directions (70%) */}
                    <div className="w-[70%] pl-4">
                        <h3 className="text-xl font-serif text-gray-700 mb-4 text-center uppercase">
                            Directions
                        </h3>
                        <div className="space-y-1">
                            {directionLines.map((direction, index) => (
                                <div key={index} className="border-b border-gray-200 pb-1">
                                    <div className="text-sm text-gray-600 leading-[0.7rem] h-4 flex items-center" style={{ fontFamily: 'Gaegu, cursive' }}>
                                        {direction && (
                                            <span className="font-semibold text-gray-800 mr-2 min-w-[20px]">
                                                {index + 1}.
                                            </span>
                                        )}
                                        {direction}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal separator line */}
            <div className="w-full h-px bg-gray-300 flex-shrink-0"></div>

            {/* Bottom Footer Section */}
            <div className="bg-white px-6 py-4 text-center flex-shrink-0">
                <p className="text-sm uppercase font-semibold" style={{ color: '#8B4513' }}>
                    WWW.GIVEMETHERECIPE.APP
                </p>
            </div>
        </div>
    );
}