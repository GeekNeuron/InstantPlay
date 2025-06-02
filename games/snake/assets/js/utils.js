// assets/js/utils.js

/**
 * @fileoverview Utility functions for the Snake game.
 */

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random integer.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random position on the grid.
 * @param {number} maxCols - Maximum number of columns (exclusive, so 0 to maxCols-1).
 * @param {number} maxRows - Maximum number of rows (exclusive, so 0 to maxRows-1).
 * @returns {{x: number, y: number}} An object with x and y grid coordinates.
 */
export function getRandomGridPosition(maxCols, maxRows) {
    return {
        x: getRandomInt(0, maxCols - 1),
        y: getRandomInt(0, maxRows - 1)
    };
}

/**
 * Checks if two positions are the same.
 * Positions are objects like {x: number, y: number}.
 * @param {{x: number, y: number} | null} pos1
 * @param {{x: number, y: number} | null} pos2
 * @returns {boolean} True if positions are identical. Returns false if either pos is null/undefined.
 */
export function arePositionsEqual(pos1, pos2) {
    if (!pos1 || !pos2) {
        console.log(`arePositionsEqual: One or both positions are null/undefined. pos1:`, pos1, "pos2:", pos2);
        return false;
    }
    const result = pos1.x === pos2.x && pos1.y === pos2.y;
    // console.log(`arePositionsEqual: Comparing (${pos1.x},${pos1.y}) and (${pos2.x},${pos2.y}). Result: ${result}`); // This log can be very noisy
    return result;
}

/**
 * Helper function to get a CSS variable value.
 * @param {string} variableNameWithVar - The name of the CSS variable including "var(...)" wrapper (e.g., 'var(--food-color)').
 * @param {string} [fallbackColor='black'] - A fallback color if the variable is not found or cannot be resolved.
 * @returns {string} The color value.
 */
export function getCssVariable(variableNameWithVar, fallbackColor = 'black') {
    if (typeof variableNameWithVar !== 'string') return fallbackColor;

    let actualVariableName = variableNameWithVar;
    if (variableNameWithVar.startsWith('var(') && variableNameWithVar.endsWith(')')) {
        actualVariableName = variableNameWithVar.substring(4, variableNameWithVar.length - 1);
    }

    try {
        const value = getComputedStyle(document.documentElement).getPropertyValue(actualVariableName).trim();
        // console.log(`getCssVariable: Fetched '${actualVariableName}' = '${value}' (fallback: '${fallbackColor}')`);
        return value || fallbackColor;
    } catch (e) {
        console.warn(`getCssVariable: Could not get CSS variable ${actualVariableName}. Falling back to ${fallbackColor}. Error:`, e);
        return fallbackColor;
    }
}
