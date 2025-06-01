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
 * @param {{x: number, y: number}} pos1
 * @param {{x: number, y: number}} pos2
 * @returns {boolean} True if positions are identical. Returns false if either pos is null/undefined.
 */
export function arePositionsEqual(pos1, pos2) {
    if (!pos1 || !pos2) {
        return false;
    }
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Helper function to get a CSS variable value.
 * @param {string} variableName - The name of the CSS variable (e.g., '--food-color').
 * @param {string} [fallbackColor='black'] - A fallback color if the variable is not found.
 * @returns {string} The color value.
 */
export function getCssVariable(variableName, fallbackColor = 'black') {
    const varNameWithoutVar = variableName.startsWith('var(')
        ? variableName.match(/var\(([^)]+)\)/)[1]
        : variableName;
    return getComputedStyle(document.documentElement).getPropertyValue(varNameWithoutVar).trim() || fallbackColor;
}
