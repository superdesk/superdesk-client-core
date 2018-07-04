/**
 * @ngdoc method
 * @name addTable
 * @param {Number} numRows
 * @param {Number} numCols
 * @description Dispatches the action that adds a table into the content.
 */
export function addTable(numRows = 1, numCols = 2) {
    const cells = [];
    const withHeader = false;

    return {
        type: 'TOOLBAR_ADD_TABLE',
        payload: {numRows, numCols, cells, withHeader},
    };
}

/**
 * @ngdoc method
 * @name addRowAfter
 * @description Dispatches the action to add a row after the currently active one.
 */
export function addRowAfter() {
    return {type: 'TOOLBAR_ADD_ROW_AFTER'};
}

/**
 * @ngdoc method
 * @name addColAfter
 * @description Dispatches the action to add a column after the currently active one.
 */
export function addColAfter() {
    return {type: 'TOOLBAR_ADD_COL_AFTER'};
}

/**
 * @ngdoc method
 * @name removeRow
 * @description Dispatches the action to remove the current row.
 */
export function removeRow() {
    return {type: 'TOOLBAR_REMOVE_ROW'};
}

/**
 * @ngdoc method
 * @name removeCol
 * @description Dispatches the action to remove the current column.
 */
export function removeCol() {
    return {type: 'TOOLBAR_REMOVE_COL'};
}

/**
 * @ngdoc method
 * @name toggleTableHeader
 * @description Toggles the tables header (enabled or disables the rendering of a header).
 * When exporting HTML, thead/th & tbody are used, if on.
 */
export function toggleTableHeader() {
    return {type: 'TOOLBAR_TABLE_HEADER'};
}

/**
 * @ngdoc method
 * @name toggleTableStyle
 * @description Toggles the style on current cell.
 */
export function toggleTableStyle(inlineStyle) {
    return {
        type: 'TOOLBAR_TABLE_STYLE',
        payload: inlineStyle,
    };
}
