// Unlike <input> and <textarea>, elements marked with contenteditable don't remember their selection
// after losing focus. To overcome this and be able to `.focus()` contenteditable elements with selection
// in a correct place their `focus` prototype method is overwritten and selection position is tracked
// on every mouse and keyboard event.

import {isElementInViewport} from '../helpers/dom';

// DOM Elements are used as keys in order not to have to set attributes which might not work well with React
// Using a WeakMap also removes the need to generate ids and automatically garbage collects.
let savedSelections = new WeakMap();

function restoreSelection(savedSelectionRanges) {
    // `parentElement` is used because `startContainer` is a text node and doesn't have the method `scrollIntoView`
    const elementToScrollIntoView = savedSelectionRanges[0].startContainer.parentElement;

    if (isElementInViewport(elementToScrollIntoView) === false) {
        elementToScrollIntoView.scrollIntoView();
    }

    var selection = window.getSelection();

    selection.removeAllRanges();

    savedSelectionRanges.forEach((range) => {
        selection.addRange(range);
    });
}

function updateSelectionPosition() {
    const {activeElement} = window.document;

    if (activeElement.getAttribute('contenteditable') !== 'true') {
        return;
    }

    const selection = window.getSelection();

    const currentSelectionRanges = new Array(selection.rangeCount)
        .fill()
        .map((_, i) => selection.getRangeAt(i));

    if (currentSelectionRanges.some((range) => range.startContainer.nodeType !== 3)) {
        // prevent saving selections on non-text nodes. Think media inside contenteditable.
        return;
    }

    savedSelections.set(activeElement, currentSelectionRanges);
}

HTMLElement.prototype.focus = (function(originalFocus) {
    return function(...args) {
        // `this` refers to DOM Element receiving focus
        const savedSelectionRanges = savedSelections.get(this);

        const savedSelectionExists = Array.isArray(savedSelectionRanges) === true
            && savedSelectionRanges.length > 0;

        if (this.getAttribute('contenteditable') === 'true' && savedSelectionExists) {
            restoreSelection(savedSelectionRanges);
        } else {
            originalFocus.call(this, ...args);
        }
    };
})(HTMLElement.prototype.focus);

window.addEventListener('mouseup', updateSelectionPosition);
window.addEventListener('keyup', updateSelectionPosition);