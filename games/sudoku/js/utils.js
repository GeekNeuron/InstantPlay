// js/utils.js
const Utils = (() => {
    /**
     * Shuffles an array in place using the Fisher-Yates algorithm.
     * @param {Array} array The array to shuffle.
     * @returns {Array} The shuffled array.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // ES6 destructuring swap
        }
        return array;
    }

    /**
     * Creates a deep copy of a 2D array.
     * Assumes the array contains primitive values or simple objects that JSON can handle.
     * @param {Array<Array<any>>} array2D The 2D array to copy.
     * @returns {Array<Array<any>>} A new deep-copied 2D array.
     */
    function deepCopy2DArray(array2D) {
        return array2D.map(arr => [...arr]);
    }

    /**
     * Converts Persian/Arabic numerals in a string to their English equivalents.
     * @param {string} str The input string, expected to be a single character for this game.
     * @returns {string} The string with numerals converted to English.
     */
    function convertNumeralsToEnglish(str) {
        if (typeof str !== 'string' || str.length === 0) return str;
        
        const numeralMap = {
            // Persian numerals
            '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', 
            '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
            // Eastern Arabic numerals
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', 
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
            // Add other numeral systems if needed, e.g., Devanagari, etc.
        };

        // Since input is maxLength=1, we only care about the first character
        const char = str[0];
        return numeralMap[char] || char;
    }

    return {
        shuffleArray,
        deepCopy2DArray,
        convertNumeralsToEnglish
    };
})();
