// assets/js/legend.js

import { FOOD_TYPES, GRID_SIZE } from './constants.js';
import { POWERUP_PROPERTIES } from './powerups.js'; // Ensure POWERUP_PROPERTIES is exported
import { getCssVariable } from './utils.js';

const legendItemsContainer = document.getElementById('legend-items-container');
const infoBubbleElement = document.getElementById('legend-info-bubble');
const bubbleTitleElement = document.getElementById('bubble-title');
const bubbleDescriptionElement = document.getElementById('bubble-description');
const bubbleArrowElement = infoBubbleElement ? infoBubbleElement.querySelector('.bubble-arrow') : null;

let currentHoveredLegendItem = null; // To manage hover state for bubble positioning

/**
 * Creates a visual representation for a legend item.
 * @param {object} item - The food type or power-up property object.
 * @returns {HTMLElement} The created legend item element.
 */
function createLegendItemElement(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'legend-item';
    itemDiv.setAttribute('role', 'button');
    itemDiv.setAttribute('tabindex', '0'); // For keyboard accessibility
    itemDiv.setAttribute('aria-label', `Info about ${item.displayName || item.id}`);

    const iconDiv = document.createElement('div');
    iconDiv.className = 'legend-item-icon';

    const iconSize = GRID_SIZE * 1.6; // Base size for icons
    iconDiv.style.width = `${iconSize}px`;
    iconDiv.style.height = `${iconSize}px`;

    if (item.symbol) { // For power-ups with symbols (like emojis)
        iconDiv.textContent = item.symbol;
        iconDiv.style.fontSize = `${GRID_SIZE * 1.1}px`; // Adjust emoji size
        if (item.color) {
            iconDiv.style.backgroundColor = getCssVariable(item.color, '#ccc'); // Use item's color var
            // Determine text color for good contrast on symbol, or use a default
            const symbolTextColor = getCssVariable('var(--text-color-on-accent)', '#FFFFFF');
            iconDiv.style.color = symbolTextColor;
        }
    } else if (item.color) { // For food items (use their color as background)
        iconDiv.style.backgroundColor = getCssVariable(item.color, '#ccc');
    } else {
        iconDiv.textContent = '?'; // Fallback if no symbol or color
        iconDiv.style.backgroundColor = '#e0e0e0';
    }

    const nameDiv = document.createElement('div');
    nameDiv.className = 'legend-item-name';
    nameDiv.textContent = item.displayName || item.id;

    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(nameDiv);

    // Event listeners for showing/hiding the info bubble
    itemDiv.addEventListener('mouseenter', (event) => showInfoBubble(item, event.currentTarget));
    itemDiv.addEventListener('focus', (event) => showInfoBubble(item, event.currentTarget)); // For keyboard navigation
    itemDiv.addEventListener('mouseleave', hideInfoBubble);
    itemDiv.addEventListener('blur', hideInfoBubble); // For keyboard navigation
    // Click can also show/toggle, or be reserved for other actions if legend items become more interactive
    itemDiv.addEventListener('click', (event) => showInfoBubble(item, event.currentTarget));


    return itemDiv;
}

/**
 * Shows the info bubble with details about the item.
 * @param {object} itemData - Data of the item (food or power-up).
 * @param {HTMLElement} targetElement - The legend item HTML element that was interacted with.
 */
function showInfoBubble(itemData, targetElement) {
    if (!infoBubbleElement || !bubbleTitleElement || !bubbleDescriptionElement) return;

    currentHoveredLegendItem = targetElement;

    bubbleTitleElement.textContent = itemData.displayName || itemData.id;
    bubbleDescriptionElement.textContent = itemData.description || 'No further information available.';

    // Make bubble visible first to calculate its dimensions correctly
    infoBubbleElement.style.display = 'block'; // Or 'flex' if your bubble uses flex
    infoBubbleElement.classList.add('show'); // Trigger opacity/transform animation

    // Position the bubble relative to the target element
    const targetRect = targetElement.getBoundingClientRect();
    const bubbleRect = infoBubbleElement.getBoundingClientRect();
    const arrowHeight = bubbleArrowElement ? 8 : 0; // Approximate arrow height

    // Default position: above the target, centered horizontally
    let top = targetRect.top - bubbleRect.height - arrowHeight - 5; // 5px spacing
    let left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
    let arrowPosition = 'arrow-down'; // Indicates arrow points down from bubble (bubble is above)

    // Adjust if bubble goes off-screen (top)
    if (top < 10) { // 10px margin from viewport top
        top = targetRect.bottom + arrowHeight + 5; // Position below target
        arrowPosition = 'arrow-up'; // Arrow points up from bubble (bubble is below)
    }

    // Adjust if bubble goes off-screen (left/right)
    if (left < 10) {
        left = 10;
    } else if (left + bubbleRect.width > window.innerWidth - 10) {
        left = window.innerWidth - bubbleRect.width - 10;
    }

    infoBubbleElement.style.top = `${top + window.scrollY}px`;
    infoBubbleElement.style.left = `${left + window.scrollX}px`;

    // Position arrow (basic centering)
    if (bubbleArrowElement) {
        infoBubbleElement.className = 'legend-info-bubble show'; // Reset arrow classes
        bubbleArrowElement.className = 'bubble-arrow'; // Reset arrow classes

        if (arrowPosition === 'arrow-down') {
            // infoBubbleElement.classList.add('arrow-down'); // Add class to style.css for this
            bubbleArrowElement.style.top = '100%'; // Arrow at the bottom of the bubble, pointing down
            bubbleArrowElement.style.left = 'calc(50% - 8px)';
            bubbleArrowElement.style.borderTopColor = getCssVariable('--modal-content-bg'); // Arrow color
            bubbleArrowElement.style.borderBottomColor = 'transparent';
             // Simplified arrow style (can be made more robust in CSS)
            bubbleArrowElement.style.borderWidth = '8px 8px 0 8px';
            bubbleArrowElement.style.borderColor = `${getCssVariable('--modal-content-bg')} transparent transparent transparent`;


        } else { // arrow-up
            // infoBubbleElement.classList.add('arrow-up');
            bubbleArrowElement.style.top = `-${arrowHeight}px`; // Arrow at the top of the bubble, pointing up
            bubbleArrowElement.style.left = 'calc(50% - 8px)';
            bubbleArrowElement.style.borderBottomColor = getCssVariable('--modal-content-bg');
            bubbleArrowElement.style.borderTopColor = 'transparent';
            // Simplified arrow style
            bubbleArrowElement.style.borderWidth = '0 8px 8px 8px';
            bubbleArrowElement.style.borderColor = `transparent transparent ${getCssVariable('--modal-content-bg')} transparent`;
        }
    }
}

/**
 * Hides the info bubble.
 */
function hideInfoBubble() {
    if (infoBubbleElement) {
        infoBubbleElement.classList.remove('show');
        // The CSS transition will handle opacity and transform.
        // Visibility is set to hidden after transition by CSS.
    }
    currentHoveredLegendItem = null;
}

/**
 * Populates the game legend with items from FOOD_TYPES and POWERUP_PROPERTIES.
 */
export function populateLegend() {
    if (!legendItemsContainer) {
        // console.warn("Legend items container 'legend-items-container' not found.");
        return;
    }
    legendItemsContainer.innerHTML = ''; // Clear any previous items

    let itemsToShow = [];

    // Add Food Types to Legend
    for (const key in FOOD_TYPES) {
        const food = FOOD_TYPES[key];
        if (food.displayName && food.description) {
            itemsToShow.push(food);
        }
    }

    // Add Power-up Types to Legend
    // Ensure POWERUP_PROPERTIES is structured with displayName and description
    for (const key in POWERUP_PROPERTIES) {
        const powerup = POWERUP_PROPERTIES[key];
        if (powerup.displayName && powerup.description) {
            itemsToShow.push(powerup);
        }
    }
    
    itemsToShow.forEach(item => {
        legendItemsContainer.appendChild(createLegendItemElement(item));
    });

    // Set :root CSS variable for grid size for legend item styling if needed
    document.documentElement.style.setProperty('--grid-size-js', `${GRID_SIZE}px`);

    // Add a global click listener to hide bubble if clicked outside
    // (Ensuring it doesn't interfere with opening it)
    document.addEventListener('click', function(event) {
        if (infoBubbleElement && infoBubbleElement.classList.contains('show')) {
            const isClickInsideBubble = infoBubbleElement.contains(event.target);
            // Check if the click was on any legend item
            let isClickOnLegendItem = false;
            if (legendItemsContainer) {
                const legendItems = legendItemsContainer.querySelectorAll('.legend-item');
                legendItems.forEach(item => {
                    if (item.contains(event.target)) {
                        isClickOnLegendItem = true;
                    }
                });
            }

            if (!isClickInsideBubble && !isClickOnLegendItem) {
                hideInfoBubble();
            }
        }
    });
}
