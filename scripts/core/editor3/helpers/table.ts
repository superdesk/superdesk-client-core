import {
    EditorChangeType,
    Modifier,
    ContentState,
    ContentBlock,
    EditorState,
    CompositeDecorator,
    convertToRaw,
    convertFromRaw
} from "draft-js";
import { OrderedSet, Map } from "immutable";
import { LinkDecorator } from "../components/links/LinkDecorator";
import { createBlockSelection } from "./selection";

/**
 * @ngdoc method
 * @name getCell
 * @param {Array} cells The array of cells in the table
 * @param {Number} row The row of the cell in the table
 * @param {Number} col The column of the cell in the table
 * @description Retrieves the content state of the cell at row/col.
 */
export function getCell(data, row, col, currentStyle, selection) {
    const decorator = new CompositeDecorator([LinkDecorator]);
    const { cells } = data;
    let cellEditorState;

    if (!cells[row] || !cells[row][col]) {
        cellEditorState = EditorState.createWithContent(
            ContentState.createFromText(""),
            decorator,
        );
    } else {
        cellEditorState = EditorState.createWithContent(
            convertFromRaw(cells[row][col]),
            decorator,
        );
    }

    if (selection != null) {
        const { anchorKey, focusKey } = selection;
        const cellContentState = cellEditorState.getCurrentContent();
        const anchorBlock = cellContentState.getBlockForKey(anchorKey);
        const focusBlock = cellContentState.getBlockForKey(focusKey);

        if (anchorBlock != null && focusBlock != null) {
            const newSelection = cellEditorState
                .getSelection()
                .merge({ ...selection });

            cellEditorState = EditorState.forceSelection(
                cellEditorState,
                newSelection,
            );
        }
    }

    if (currentStyle != null) {
        cellEditorState = EditorState.setInlineStyleOverride(
            cellEditorState,
            OrderedSet(currentStyle),
        );
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
export function setCell(data, row, col, cellEditorState: EditorState) {
    const cellContentState = cellEditorState.getCurrentContent();
    let needUpdate = true;
    let forceUpdate = true;

    if (!data.cells[row]) {
        data.cells[row] = [];
    }

    if (data.cells[row][col]) {
        needUpdate =
            JSON.stringify(data.cells[row][col]) !==
            JSON.stringify(convertToRaw(cellContentState));
        forceUpdate =
            convertFromRaw(data.cells[row][col]).getPlainText() !==
            cellContentState.getPlainText();
    }

    data.cells[row][col] = convertToRaw(cellContentState);

    return { data, needUpdate, forceUpdate };
}

/**
 * @ngdoc method
 * @name getData
 * @param {Object} contentState The editor content state
 * @param {Object} block The current atomic block
 * @description Returns the data contained in the entity of this atomic block.
 * @return {Object}
 */
export function getData(contentState: ContentState, block: ContentBlock) {
    const entityKey = block.getEntityAt(0);
    const { data } = contentState.getEntity(entityKey).getData();
    const blockData = JSON.parse(block.getData().get('data'));

    if (!blockData && data) {
        return data;
    }

    return blockData;
}

/**
 * @ngdoc method
 * @name getData
 * @param {Object} contentState The editor content state
 * @param {Object} block The current atomic block
 * @description Returns EditorState with the data contained in the entity of this atomic block.
 * @return {Object}
 */
export function setData(
    editorState: EditorState,
    block: ContentBlock,
    data,
    lastChangeType,
): EditorState {
    const contentState = editorState.getCurrentContent();
    const entityKey = block.getEntityAt(0);
    const selection = createBlockSelection(editorState, block);
    const newContentState = Modifier.setBlockData(
        contentState,
        selection,
        Map().set("data", JSON.stringify(data)),
    );

    newContentState.replaceEntityData(entityKey, {data});

    const newEditorState = EditorState.push(
        editorState,
        newContentState,
        lastChangeType,
    );

    return newEditorState;
}
