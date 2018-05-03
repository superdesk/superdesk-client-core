/**
 * Collapse selection to the start
 *
 * @param {SelectionState} selection
 * @returns {SelectionState}
 */
export function collapseSelection(selection) {
    if (selection.isCollapsed()) {
        return selection;
    }

    return selection.merge({
        isBackward: false,
        anchorKey: selection.getStartKey(),
        anchorOffset: selection.getStartOffset(),
        focusKey: selection.getStartKey(),
        focusOffset: selection.getStartOffset(),
    });
}