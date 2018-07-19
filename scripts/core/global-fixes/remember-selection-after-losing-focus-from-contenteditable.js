// Unlike <input> and <textarea>, elements marked with contenteditable don't remember their selection
// after losing focus. To overcome this and be able to focus contenteditable elements with selection in a correct place
// their `focus` prototype method is overwritten and selection position is tracked on every mouse and keyboard event.

import {isElementInViewport} from '../helpers/dom';

let domMarkerAttribute = 'contenteditable-selection-maintainer';
let savedSelections = {};

let currentId = 0;
let getNextId = () => (++currentId).toString();

function restoreSelection() {
    // `this` refers to DOM element receiving focus
    const id = this.getAttribute(domMarkerAttribute);

    if (id == null) {
        return;
    }

    var selection = window.getSelection();

    selection.removeAllRanges();

    if (savedSelections[id].length < 1) {
        return;
    }

    const elementToScrollIntoView = savedSelections[id][0].startContainer.parentElement;

    if (isElementInViewport(elementToScrollIntoView) === false) {
        elementToScrollIntoView.scrollIntoView();
    }

    savedSelections[id].forEach((range) => {
        selection.addRange(range);
    });
}

function updateSelectionPosition() {
    const {activeElement} = window.document;

    if (activeElement.getAttribute('contenteditable') !== 'true') {
        return;
    }

    let id = activeElement.getAttribute(domMarkerAttribute);

    if (id == null) {
        id = getNextId();
        activeElement.setAttribute(domMarkerAttribute, id);
        Object.getPrototypeOf(activeElement).focus = restoreSelection;
        savedSelections[id] = [];
    }

    const selection = window.getSelection();

    const selectionRanges = new Array(selection.rangeCount)
        .fill()
        .map((_, i) => selection.getRangeAt(i));

    if (selectionRanges.some((range) => range.startContainer.nodeType !== 3)) {
        // prevent saving selections on non-text nodes. Think media inside contenteditable.
        return;
    }

    savedSelections[id] = selectionRanges;
}

window.addEventListener('mouseup', updateSelectionPosition);
window.addEventListener('keyup', updateSelectionPosition);