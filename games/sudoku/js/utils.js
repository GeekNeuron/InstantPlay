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

    // You can add other utility functions here if needed.
    // For example, a function to get a random integer in a range:
    // function getRandomInt(min, max) {
    //     min = Math.ceil(min);
    //     max = Math.floor(max);
    //     return Math.floor(Math.random() * (max - min + 1)) + min;
    // }

    return {
        shuffleArray,
        deepCopy2DArray
        // getRandomInt
    };
})();
