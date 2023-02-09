export function addPullQuote() {
    return {
        type: 'TOOLBAR_ADD_PULL_QUOTE',
        payload: {numRows: 1, numCols: 1, cells: [], withHeader: false, readOnly: false},
    };
}

export function togglePullQuoteToolbar() {
    return {
        type: 'TOGGLE_PULL_QUOTE_TOOLBAR',
    };
}
