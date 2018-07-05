import {Modifier, ContentState, EditorState, CompositeDecorator, convertToRaw, convertFromRaw} from 'draft-js';
import {OrderedSet} from 'immutable';
import {LinkDecorator} from '../components/links/LinkDecorator';
import {createBlockSelection} from './selection';

/**
 * @ngdoc method
 * @name getCell
 * @param {Array} cells The array of cells in the table
 * @param {Number} row The row of the cell in the table
 * @param {Number} col The column of the cell in the table
 * @description Retrieves the content state of the cell at row/col.
 */
export function getCell(data, row, col) {
    const decorator = new CompositeDecorator([LinkDecorator]);
    const {cells, currentStyle} = data;
    let cellEditorState;

    if (!cells[row] || !cells[row][col]) {
        cellEditorState = EditorState.createWithContent(ContentState.createFromText(''), decorator);
    } else {
        cellEditorState = EditorState.createWithContent(convertFromRaw(cells[row][col]), decorator);
    }

    if (currentStyle) {
        cellEditorState = EditorState.setInlineStyleOverride(cellEditorState, OrderedSet(currentStyle));
    }

    return cellEditorState;
}

/**
 * @ngdoc method
 * @name TableBlockComponent#setCell
 * @param {Number} row The row of the cell in the table
 * @param {Number} col The column of the cell in the table
 * @param {Object} cellContentState The state of the editor within the cell
 * @description Updates data about this cell inside the entity for this atomic
 * block.
 */
export function setCell(data, row, col, cellEditorState) {
    const cellContentState = cellEditorState.getCurrentContent();

    data.forceUpdate = true;

    if (!data.cells[row]) {
        data.cells[row] = [];
    }

    if (data.cells[row][col]) {
        data.forceUpdate = convertFromRaw(data.cells[row][col]).getPlainText() !== cellContentState.getPlainText();
    }

    data.cells[row][col] = convertToRaw(cellContentState);
    data.currentStyle = cellEditorState.getCurrentInlineStyle().toArray();
    data.lastChange = cellEditorState.getLastChangeType();

    return data;
}

/**
 * @ngdoc method
 * @name getData
 * @param {Object} contentState The editor content state
 * @param {Object} block The current atomic block
 * @description Returns the data contained in the entity of this atomic block.
 * @return {Object}
 */
export function getData(editorState, block) {
    const contentState = editorState.getCurrentContent();
    const entityKey = block.getEntityAt(0);
    const entity = contentState.getEntity(entityKey);
    const {data} = entity.getData();

    if (block.getData().get('data')) {
        return JSON.parse(block.getData().get('data'));
    }

    return data;
}

/**
 * @ngdoc method
 * @name getData
 * @param {Object} contentState The editor content state
 * @param {Object} block The current atomic block
 * @description Returns the data contained in the entity of this atomic block.
 * @return {Object}
 */
export function setData(editorState, block, data) {
    const contentState = editorState.getCurrentContent();
    const entityKey = block.getEntityAt(0);
    const selection = createBlockSelection(editorState, block);
    const newContentState = Modifier.setBlockData(contentState, selection, {data: JSON.stringify(data)});

    return EditorState.push(
        editorState,
        newContentState.replaceEntityData(entityKey, {data}),
        data.lastChangeType
    );
}
