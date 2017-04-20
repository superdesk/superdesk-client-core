/**
 * @ngdoc method
 * @name addTable
 * @param {Number} numRows
 * @param {Number} numCols
 * @description Dispatches the action that adds a table into the content.
 */
export function addTable(numRows, numCols) {
    const cells = [];

    return {
        type: 'TOOLBAR_ADD_TABLE',
        payload: {numRows, numCols, cells}
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
