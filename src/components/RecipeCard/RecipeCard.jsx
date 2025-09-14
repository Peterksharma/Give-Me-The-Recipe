"use client";
import { UsersRound, Clock8, Printer, ChevronDown, ChevronUp } from "lucide-react";
import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { printRecipe } from '@/utils/printUtils';

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

    // Print function using utility
    const handlePrint = () => {
        printRecipe(recipeData);
    };

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

    // Create lines that only show actual content when scrolling
    const createScrollableLines = (items, count) => {
        // If we have more items than can fit, only show the actual items
        if (items.length <= count) {
            return items;
        }
        // If we have more items than can fit, show all items (scrollable)
        return items;
    };

    // Use a default row count, will be updated when card resizes
    const [rowCount, setRowCount] = useState(10);
    
    // State for mobile header collapse
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

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

    const ingredientLines = createScrollableLines(recipeData.ingredients, rowCount);
    const directionLines = createScrollableLines(recipeData.directions, rowCount);

    return (
        <div ref={cardRef} className="w-[90vw] min-[450px]:w-[75vw] min-[768px]:w-[70vw] h-[60vh] mx-auto bg-white border border-gray-300 rounded-lg shadow-sm flex flex-col transition-all duration-300 hover:shadow-lg hover:border-gray-400">
            {/* Top Header Section */}
            <div className="bg-gray-100 flex-shrink-0 relative">
                {/* Mobile Toggle Button - Only visible on mobile */}
                <button
                    onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                    className="min-[450px]:hidden w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-200 transition-colors"
                >
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">
                            {recipeData.title}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Printer 
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrint();
                            }}
                            className="w-5 h-5 text-gray-700 hover:text-blue-600 transition-colors"
                        />
                        {isHeaderCollapsed ? (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                        )}
                    </div>
                </button>

                {/* Collapsible Content - Hidden on mobile when collapsed */}
                <div className={`min-[450px]:block transition-all duration-300 overflow-hidden ${
                    isHeaderCollapsed ? 'max-h-0 min-[450px]:max-h-none' : 'max-h-96 min-[450px]:max-h-none'
                }`}>
                    <div className="px-6 py-4 flex items-center">
                        <div className="hidden min-[450px]:block text-7xl text-gray-700 font-bold text-center w-[25%]" style={{ fontFamily: 'Corinthia, cursive' }}>
                            Recipe
                        </div>
                        <div className="w-full min-[450px]:w-[75%] min-[450px]:pl-6">
                            <h2 className="hidden min-[450px]:block text-2xl font-bold text-gray-700 uppercase tracking-wide">
                                {recipeData.title}
                            </h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 justify-start">
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                    <UsersRound className="w-4 h-4" />
                                    SERVES: {recipeData.serves}
                                </span>
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                    <Clock8 className="w-4 h-4" />
                                    PREP TIME: {recipeData.prepTime}
                                </span>
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                    <Clock8 className="w-4 h-4" />
                                    COOK TIME: {recipeData.cookTime}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={handlePrint}
                            className="hidden min-[450px]:block absolute top-4 right-2 p-2 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            <Printer className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Horizontal separator line */}
            <div className="w-full h-px bg-gray-300 flex-shrink-0"></div>

            {/* Main Content Area */}
            <div ref={contentRef} className="px-6 py-6 flex-1 overflow-y-auto">
                <div className="flex flex-col min-[450px]:flex-row h-full">
                    {/* Left Column - Ingredients (stacked on mobile) */}
                    <div className="w-full min-[450px]:w-[30%] min-[450px]:pr-4">
                        <h3 className="text-xl font-serif text-gray-700 mb-4 text-center uppercase">
                            Ingredients
                        </h3>
                        <div className="space-y-2">
                            {ingredientLines.map((ingredient, index) => (
                                <div key={index} className="w-full">
                                    <div className="text-sm text-gray-600 leading-tight h-auto min-h-[1.5rem] flex items-start" style={{ fontFamily: 'Gaegu, cursive' }}>
                                        {ingredient && (
                                            <span className="font-semibold text-gray-800 mr-2 min-w-[20px] flex-shrink-0">
                                                {index + 1}.
                                            </span>
                                        )}
                                        <span className="flex-1">{ingredient}</span>
                                    </div>
                                    <div className="w-full border-b border-gray-200 pb-1"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vertical separator line - hidden on mobile */}
                    <div className="hidden min-[450px]:block w-px bg-gray-300 mx-4"></div>

                    {/* Right Column - Directions (stacked on mobile) */}
                    <div className="w-full min-[450px]:w-[70%] min-[450px]:pt-8 min-[450px]:pl-4">
                        <h3 className="text-xl font-serif text-gray-700 mb-4 text-center uppercase">
                            Directions
                        </h3>
                        <div className="space-y-2">
                            {directionLines.map((direction, index) => (
                                <div key={index} className="w-full">
                                    <div className="text-sm text-gray-600 leading-tight h-auto min-h-[1.5rem] flex items-start" style={{ fontFamily: 'Gaegu, cursive' }}>
                                        {direction && (
                                            <span className="font-semibold text-gray-800 mr-2 min-w-[20px] flex-shrink-0">
                                                {index + 1}.
                                            </span>
                                        )}
                                        <span className="flex-1">{direction}</span>
                                    </div>
                                    <div className="w-full border-b border-gray-200 pb-1"></div>
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
                <p className="text-xs min-[450px]:text-sm uppercase font-semibold" style={{ color: '#8B4513' }}>
                    WWW.GIVEMETHERECIPE.APP
                </p>
            </div>
        </div>
    );
}