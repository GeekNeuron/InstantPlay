import { Runner } from './Runner.js';

function onDocumentLoad() {
    new Runner('.interstitial-wrapper');
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
