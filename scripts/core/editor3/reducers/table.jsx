import {EditorState} from 'draft-js';
import {onChange} from './editor3';
import insertAtomicBlockWithoutEmptyLines from '../helpers/insertAtomicBlockWithoutEmptyLines';

/**
 * @description Contains the list of table related reducers.
 */
const table = (state = {}, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_TABLE':
        return addTable(state, action.payload);
    case 'TOOLBAR_ADD_ROW_AFTER':
        return addRowAfter(state);
    case 'TOOLBAR_ADD_COL_AFTER':
        return addColAfter(state);
    case 'TOOLBAR_REMOVE_ROW':
        return removeRow(state);
    case 'TOOLBAR_REMOVE_COL':
        return removeCol(state);
    case 'TOOLBAR_TABLE_HEADER':
        return toggleTableHeader(state);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name addTable
 * @param {Object} data Table data (numRows, numCols, cells).
 * @description Adds a table into the content.
 */
const addTable = (state, data) => {
    var {editorState} = state;

    const contentState = state.editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('TABLE', 'MUTABLE', {data});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    editorState = insertAtomicBlockWithoutEmptyLines(
        editorState,
        entityKey,
        ' '
    );

    return onChange(state, editorState);
};

/**
 * @ngdoc method
 * @name addRowAfter
 * @description Adds a row after the currently active one.
 */
const addRowAfter = (state) =>
    processCells(state, (prevCells, numCols, nRows, i, j, withHeader) => {
        let numRows = nRows + 1;
        let cells = [];

        prevCells.forEach((row, index) => {
            cells.push(row);

            if (index === i) {
                cells.push([]);
            }
        });

        return {cells, numRows, numCols, withHeader};
    });

/**
 * @ngdoc method
 * @name removeRow
 * @description Removes the currently active row.
 */
const removeRow = (state) =>
    processCells(state, (cells, numCols, nRows, i, j, withHeader) => {
        let numRows = nRows;

        if (numRows > 1) {
            cells.splice(i, 1);
            numRows -= 1;
        }

        return {cells, numRows, numCols, withHeader};
    });

/**
 * @ngdoc method
 * @name addColAfter
 * @description Adds a column after the currently active one.
 */
const addColAfter = (state) =>
    processCells(state, (cells, numCols, numRows, i, j, withHeader) => ({
        numRows: numRows,
        numCols: numCols + 1,
        withHeader: withHeader,
        cells: cells.map((_, ii) =>
            Array.from(new Array(numCols + 1))
                .map((_, jj) => {
                    if (jj === j + 1) {
                        return null;
                    }

                    let orig = jj;

                    if (jj > j + 1) {
                        orig -= 1;
                    }

                    if (cells[ii] && cells[ii][orig]) {
                        return cells[ii][orig];
                    }

                    return null;
                }))
    }));

/**
 * @ngdoc method
 * @name removeCol
 * @description Removes the currently active column.
 */
const removeCol = (state) =>
    processCells(state, (prevCells, nCols, numRows, i, j, withHeader) => {
        let numCols = nCols;
        let cells = prevCells;

        if (numCols > 1) {
            numCols -= 1;
            cells = prevCells.map((cell) => {
                cell.splice(j, 1);
                return cell;
            });
        }

        return {cells, numRows, numCols, withHeader};
    });

/**
 * @ngdoc method
 * @name processCells
 * @param {Function} fn Function that is called with parameters
 * (cells, numCols, numRows, i, j, withHeader) and is expected to return the new
 * data that should be placed on the table entity. The expected return
 * is an object with keys {cells, numRows, numCols}.
 * @description Helper function to help process the cells in the currently active
 * table and transform the entity data to a new form, using a callback function.
 */
const processCells = (state, fn) => {
    const {activeCell, editorState} = state;

    if (activeCell === null) {
        return state;
    }

    const {i, j, key} = activeCell;
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(key);
    const entityKey = block.getEntityAt(0);
    const entity = contentState.getEntity(entityKey);
    const {cells, numRows, numCols, withHeader} = entity.getData().data;
    const newContentState = contentState.mergeEntityData(entityKey, {
        data: fn(cells, numCols, numRows, i, j, withHeader)
    });
    const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
    const entityDataHasChanged = true;

    return onChange(state, newEditorState, entityDataHasChanged);
};

/**
 * @ngdoc method
 * @name toggleTableHeader
 * @description Toggles the table's header.
 */
const toggleTableHeader = (state) =>
    processCells(state, (cells, numCols, numRows, i, j, withHeader) =>
        ({cells: cells, numRows: numRows, numCols: numCols, withHeader: !withHeader}));

export default table;
