// assets/js/tutorialManager.js

import { TUTORIAL_COMPLETED_KEY } from './constants.js';

export class TutorialManager {
    constructor() {
        this.overlayElement = document.getElementById('tutorial-overlay');
        this.tooltipElement = document.getElementById('tutorial-tooltip');
        this.textElement = document.getElementById('tutorial-text');
        this.nextButton = document.getElementById('tutorial-next-btn');

        if (!this.overlayElement || !this.tooltipElement || !this.textElement || !this.nextButton) {
            console.warn("Tutorial UI elements not found in HTML. Tutorial will be disabled.");
            this.isEnabled = false;
            return;
        }

        this.isEnabled = true;
        this.currentStep = 0;
        
        // Define all tutorial steps here
        this.steps = [
            {
                text: "Welcome to Snake! Use the ARROW KEYS or SWIPE on the screen to move.",
                targetElementId: 'gameCanvas',
                position: 'center'
            },
            {
                text: "Your goal is to eat the food items that appear on the board to grow and score points.",
                targetElementId: 'game-legend',
                position: 'top'
            },
            {
                text: "Use these dropdowns to select your preferred Game Mode and Difficulty before you start.",
                targetElementId: 'difficulty-select-menu', // It will highlight the parent container
                position: 'bottom'
            },
            {
                text: "Click or hover over these icons to learn about each food and power-up.",
                targetElementId: 'legend-items-container',
                position: 'top'
            },
            {
                text: "You can change the theme by clicking the game title. Press 'Start Game' when you're ready. Good luck!",
                targetElementId: 'start-game-btn',
                position: 'bottom'
            }
        ];

        this.nextButton.addEventListener('click', () => this.nextStep());
    }

    start() {
        if (!this.isEnabled) return;

        const hasCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
        if (hasCompleted === 'true') {
            // console.log("Tutorial already completed.");
            return; // Don't show tutorial if already completed
        }

        this.currentStep = 0;
        this.overlayElement.classList.remove('hidden');
        this.showStep(this.currentStep);
    }

    nextStep() {
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            this.showStep(this.currentStep);
        } else {
            this.end();
        }
    }

    showStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) {
            this.end();
            return;
        }

        this.textElement.textContent = step.text;
        
        // Change button text on the last step
        if (stepIndex === this.steps.length - 1) {
            this.nextButton.textContent = "Let's Play!";
        } else {
            this.nextButton.textContent = "Next";
        }
        
        const targetElement = document.getElementById(step.targetElementId);
        if (targetElement) {
            this.highlightElement(targetElement);
            this.positionTooltip(targetElement, step.position);
        } else {
            // Position in center if no target element
            this.tooltipElement.style.top = '50%';
            this.tooltipElement.style.left = '50%';
            this.tooltipElement.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    highlightElement(element) {
        // First, remove highlight from any previous element
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Add highlight to the new target element
        element.classList.add('tutorial-highlight');
    }

    positionTooltip(target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();

        let top, left;

        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 15;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = targetRect.bottom + 15;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - 15;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + 15;
                break;
            default: // center
                top = window.innerHeight / 2 - tooltipRect.height / 2;
                left = window.innerWidth / 2 - tooltipRect.width / 2;
        }
        
        // Keep tooltip within viewport
        if (left < 10) left = 10;
        if (top < 10) top = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;
        if (top + tooltipRect.height > window.innerHeight - 10) top = window.innerHeight - tooltipRect.height - 10;


        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.left = `${left}px`;
    }

    end() {
        this.overlayElement.classList.add('hidden');
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    }
}
