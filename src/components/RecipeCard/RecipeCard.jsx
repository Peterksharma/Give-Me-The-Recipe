"use client";
import { UsersRound, Clock8, Printer, Share2, Check, CircleAlert } from "lucide-react";
import React, { useState } from 'react';
import { printRecipe, shareRecipe } from '@/utils/printUtils';

/**
 * RecipeCard — the heart of the app. The whole site is this one card:
 * it shows usage hints when empty, a skeleton while extracting, the
 * error when extraction fails, and the recipe when it succeeds.
 *
 * Look: an honest kitchen index card — cream header, red top rule,
 * pale blue ruled lines, handwriting for the content. Navy is the ink.
 *
 * Sizing philosophy: the card is width-constrained (like a real card)
 * but grows vertically with its content — the page scrolls, the card
 * never clips or hides anything behind an inner scrollbar.
 */

// Index-card palette
const INK = '#1e3a8a';        // navy ink (matches the site header)
const RULE_RED = '#D96C5F';   // the card's red top rule
const RULE_BLUE = '#C9DAEB';  // pale blue ruled lines

// Default placeholder shown before any extraction has been attempted.
const DEFAULT_RECIPE = {
    title: "Recipe Name",
    serves: "N/A",
    prepTime: "N/A",
    cookTime: "N/A",
    ingredients: [],
    directions: [
        "Enter the URL of the recipe you want to extract",
        "Click the \"Extract Recipe\" button",
        "The recipe ingredients and instructions will be extracted and displayed",
        "You can print or share the recipe",
        "Bon Appetit!"
    ]
};

// Fixed skeleton line widths (deterministic, so SSR and client agree).
const SKELETON_WIDTHS = ['w-11/12', 'w-2/3', 'w-4/5', 'w-3/4', 'w-5/6', 'w-1/2'];

/** One ruled line of the card: red number + handwritten text over a
 *  pale blue rule, written in with a small stagger. */
function RuledItem({ index, text }) {
    return (
        <li
            className="pb-1.5 animate-line-write"
            style={{ borderBottom: `1px solid ${RULE_BLUE}`, animationDelay: `${Math.min(index, 14) * 45}ms` }}
        >
            <div
                className="text-base text-gray-700 leading-snug flex items-start"
                style={{ fontFamily: 'var(--font-gaegu), cursive' }}
            >
                <span className="font-semibold mr-2 min-w-[22px] flex-shrink-0" style={{ color: RULE_RED }}>
                    {index + 1}.
                </span>
                <span className="flex-1">{text}</span>
            </div>
        </li>
    );
}

/** Pulsing placeholder lines shown while a recipe is being extracted. */
function SkeletonLines({ count }) {
    return (
        <ul className="space-y-3 animate-pulse" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <li key={i} className="pb-2" style={{ borderBottom: `1px solid ${RULE_BLUE}` }}>
                    <div className={`h-4 rounded bg-gray-200 ${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}`} />
                </li>
            ))}
        </ul>
    );
}

/** Column with the serif heading used by both Ingredients and Directions. */
function CardColumn({ heading, items, isLoading, skeletonCount }) {
    return (
        <div className="flex-1 min-w-0">
            <h3 className="text-xl font-serif mb-4 text-center uppercase tracking-wide" style={{ color: INK }}>
                {heading}
            </h3>
            {isLoading ? (
                <SkeletonLines count={skeletonCount} />
            ) : (
                <ul className="space-y-2">
                    {items.map((text, index) => (
                        <RuledItem key={index} index={index} text={text} />
                    ))}
                </ul>
            )}
        </div>
    );
}

/** Small labeled action ("Share", "Print") sitting on the meta line. */
function CardAction({ onClick, disabled, label, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-full border border-blue-900/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-900 hover:bg-blue-900 hover:text-white active:scale-95 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-blue-900 disabled:active:scale-100"
        >
            {children}
            {label}
        </button>
    );
}

export default function RecipeCard({ recipe = null, isLoading = false, error = null }) {
    const recipeData = recipe || DEFAULT_RECIPE;
    const showError = Boolean(error) && !isLoading;
    const actionsDisabled = isLoading || showError || !recipe;

    // 'idle' | 'copied' — drives the brief check-mark after a clipboard share
    const [shareFeedback, setShareFeedback] = useState('idle');

    const handleShare = async () => {
        const outcome = await shareRecipe(recipeData);
        if (outcome === 'copied') {
            setShareFeedback('copied');
            setTimeout(() => setShareFeedback('idle'), 2000);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-[#FFFEFA] border border-gray-300 rounded-lg shadow-md flex flex-col animate-card-deal transition-shadow duration-300 hover:shadow-xl">

            {/* Header: script logo + title + meta. Stacks on small screens. */}
            <div
                className="bg-[#FAF6EC] rounded-t-lg px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-0"
                style={{ borderBottom: `2px solid ${RULE_RED}` }}
            >
                <div
                    className="text-5xl sm:text-6xl md:text-7xl font-bold text-center sm:w-[28%] flex-shrink-0"
                    style={{ fontFamily: 'var(--font-corinthia), cursive', color: INK }}
                >
                    Recipe
                </div>
                <div className="w-full sm:w-[72%] text-center sm:text-left sm:pl-8 min-w-0">
                    {isLoading ? (
                        <div className="animate-pulse space-y-3 py-1">
                            <div className="h-6 rounded bg-gray-300 w-2/3 mx-auto sm:mx-0" />
                            <div className="h-4 rounded bg-gray-200 w-5/6 mx-auto sm:mx-0" />
                        </div>
                    ) : (
                        <>
                            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 uppercase tracking-wide break-words">
                                {showError ? 'Recipe Name' : recipeData.title}
                            </h2>
                            {/* The line under the title: meta on the left, actions on the right */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 justify-center sm:justify-between">
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 justify-center sm:justify-start">
                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                        <UsersRound className="w-4 h-4" style={{ color: RULE_RED }} />
                                        SERVES: {showError ? 'N/A' : recipeData.serves}
                                    </span>
                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                        <Clock8 className="w-4 h-4" style={{ color: RULE_RED }} />
                                        PREP: {showError ? 'N/A' : recipeData.prepTime}
                                    </span>
                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                        <Clock8 className="w-4 h-4" style={{ color: RULE_RED }} />
                                        COOK: {showError ? 'N/A' : recipeData.cookTime}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CardAction
                                        onClick={handleShare}
                                        disabled={actionsDisabled}
                                        label={shareFeedback === 'copied' ? 'Copied' : 'Share'}
                                    >
                                        {shareFeedback === 'copied' ? (
                                            <Check className="w-3.5 h-3.5 text-green-600" />
                                        ) : (
                                            <Share2 className="w-3.5 h-3.5" />
                                        )}
                                    </CardAction>
                                    <CardAction
                                        onClick={() => printRecipe(recipeData)}
                                        disabled={actionsDisabled}
                                        label="Print"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                    </CardAction>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Body: error note, or the two ruled columns. */}
            <div className="px-4 sm:px-6 py-6 flex-1 min-h-[40vh]">
                {showError ? (
                    <div className="h-full min-h-[32vh] flex flex-col items-center justify-center text-center gap-3 px-4">
                        <CircleAlert className="w-10 h-10" style={{ color: RULE_RED }} />
                        <p className="text-2xl text-gray-700" style={{ fontFamily: 'var(--font-gaegu), cursive' }}>
                            {error}
                        </p>
                        <p className="text-lg text-gray-500" style={{ fontFamily: 'var(--font-gaegu), cursive' }}>
                            Try another URL, or double-check this one.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-6 md:gap-0 h-full">
                        {/* Ingredients (35% on desktop, full width stacked on mobile) */}
                        <div className="w-full md:w-[35%] md:pr-5">
                            <CardColumn
                                heading="Ingredients"
                                items={recipeData.ingredients}
                                isLoading={isLoading}
                                skeletonCount={8}
                            />
                        </div>

                        {/* Separator: vertical on desktop, horizontal on mobile */}
                        <div className="hidden md:block w-px" style={{ background: RULE_BLUE }} />
                        <div className="md:hidden w-full h-px" style={{ background: RULE_BLUE }} />

                        {/* Directions */}
                        <div className="w-full md:w-[65%] md:pl-5">
                            <CardColumn
                                heading="Directions"
                                items={recipeData.directions}
                                isLoading={isLoading}
                                skeletonCount={6}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full h-px bg-gray-200" />

            {/* Card footer */}
            <div className="px-6 py-3 text-center">
                <p className="text-xs sm:text-sm uppercase font-semibold tracking-widest" style={{ color: '#8B4513' }}>
                    WWW.GIVEMETHERECIPE.APP
                </p>
            </div>
        </div>
    );
}
