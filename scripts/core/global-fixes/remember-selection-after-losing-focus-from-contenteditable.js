// Unlike <input> and <textarea>, elements marked with contenteditable don't remember their selection
// after losing focus. To overcome this and be able to `.focus()` contenteditable elements with selection
// in a correct place their `focus` prototype method is overwritten and selection position is tracked
// on every mouse and keyboard event.

import {isElementInViewport} from '../helpers/dom/isElementInViewport';
import {findParent} from '../helpers/dom/findParent';

// DOM Elements are used as keys in order not to have to set attributes which might not work well with React
// Using a WeakMap also removes the need to generate ids and automatically garbage collects.
let savedSelections = new WeakMap();

function restoreSelection(savedSelectionRanges) {
    // `findParent` is used because `startContainer` might be a text node and not have a method `scrollIntoView`
    const elementToScrollIntoView = findParent(
        savedSelectionRanges[0].startContainer,
        (el) => typeof el.scrollIntoView === 'function',
        true
    );

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

    const currentSelectionRangesMeta = new Array(selection.rangeCount)
        .fill()
        .map((_, i) => {
            const range = selection.getRangeAt(i);

            return {
                range: range,
                originalStartContainer: range.startContainer,
                originalEndContainer: range.endContainer,
            };
        });

    if (currentSelectionRangesMeta.some(({range}) => range.startContainer.nodeType !== 3)) {
        // prevent saving selections on non-text nodes. Think media inside contenteditable.
        return;
    }
    savedSelections.set(activeElement, currentSelectionRangesMeta);
}

HTMLElement.prototype.focus = (function(originalFocus) {
    return function(...args) {
        // `this` refers to DOM Element receiving focus
        const savedSelectionRangesMeta = savedSelections.get(this);

        const savedSelectionExists = Array.isArray(savedSelectionRangesMeta) === true
            && savedSelectionRangesMeta.length > 0
            && savedSelectionRangesMeta.every(
                ({range, originalStartContainer, originalEndContainer}) =>
                    range.startContainer === originalStartContainer
                    && range.endContainer === originalEndContainer
                    && document.body.contains(range.startContainer) && document.body.contains(range.endContainer)
            );

        if (this.getAttribute('contenteditable') === 'true' && savedSelectionExists) {
            restoreSelection(savedSelectionRangesMeta.map(({range}) => range));
        } else {
            originalFocus.call(this, ...args);
        }
    };
})(HTMLElement.prototype.focus);

window.addEventListener('mouseup', updateSelectionPosition);
window.addEventListener('keyup', updateSelectionPosition);