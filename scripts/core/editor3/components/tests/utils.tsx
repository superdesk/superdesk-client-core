import PropTypes from 'prop-types';
import {Map, OrderedSet, List, Repeat} from 'immutable';
import {
    EditorState,
    ContentState,
    ContentBlock,
    RichUtils,
    SelectionState,
    convertToRaw,
    CharacterMetadata,
    genKey,
} from 'draft-js';

import insertAtomicBlockWithoutEmptyLines from '../../helpers/insertAtomicBlockWithoutEmptyLines';

/**
 * @name mockStore
 * @description Creates a new Redux store mock and returns an object containing
 * two keys: "store" as the actual store, and "options" as the parameter to be
 * passed to enzyme's mount command in order to use this store as context.
 * @param {Object} state The state the store should have when queried.
 * @returns {Object} The object containing the store and the enzyme mount param.
 */
export default function mockStore(state = {}) {
    const store = {
        subscribe: () => ({}),
        dispatch: () => ({}),
        getState: () => state,
    };

    const options = {
        context: {store},
        childContextTypes: {
            store: PropTypes.object.isRequired,
        },
    };

    return {store, options};
}

/**
 * @name stateWithLink
 * @description Returns a new editorState that has the text "click HERE to open page"
 * as content, having the uppercased letters marked as an entity of type LINK, containing
 * the data {link: {href: 'entity-url'}}
 * @returns {Object} editorState
 */
export function stateWithLink() {
    const contentState = ContentState
        .createFromText('click HERE to open page')
        .createEntity('LINK', 'MUTABLE', {link: {href: 'entity-url'}});

    const entityKey = contentState.getLastCreatedEntityKey();
    const blockKey = contentState.getFirstBlock().getKey();
    const linkSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 6,
        focusOffset: 9,
    });

    return RichUtils.toggleLink(
        EditorState.createWithContent(contentState),
        linkSelection,
        entityKey
    );
}

/**
 * @description Returns a block containing an image and it's host content state.
 * @returns {Object} Keys 'block' and 'contentState'
 */
export function imageBlockAndContent() {
    return createBlockAndContent('MEDIA', {
        media: {
            _type: 'archive', // make sure edit icon is visible
            renditions: {original: {href: 'image_href'}},
            alt_text: 'image_alt_text',
            headline: 'image_headline',
            description_text: 'image_description',
            type: 'picture',
        },
    });
}

/**
 * @description Creates a contentState containing an atomic block with the entity
 * having the given type and containing the given data.
 * @param {String} type Entity type
 * @param {Object} data Entity data
 * @returns {Object} Keys 'block' and 'contentState'
 */
export function createBlockAndContent(type, data) {
    const cs = ContentState.createFromText('here is an image:');
    const contentState = cs.createEntity(type, 'MUTABLE', data);
    const entityKey = contentState.getLastCreatedEntityKey();
    const {editorState} = insertAtomicBlockWithoutEmptyLines(
        EditorState.createWithContent(contentState),
        entityKey, ' ');
    const block = editorState.getCurrentContent().getBlocksAsArray()[1];

    return {block, contentState};
}

/**
 * @description Creates a contentState containing an atomic block that is an embed.
 * @returns {Object} Keys 'block' and 'contentState'
 */
export function embedBlockAndContent() {
    return createBlockAndContent('EMBED', {
        data: {
            html: '<h1>Embed Title</h1>',
        },
    });
}

/**
 * @description Creates a new content state containing a given list of regular blocks.
 * @param {Array<Array>} Contains an array that describes blocks. Each item is an array
 * of 3 elements, describing block properties: style, depth and text.
 * @returns {ContentState}
 */
export function blocksWithText(list) {
    return ContentState.createFromBlockArray(list.map((htmlData) => {
        const type = htmlData[0] || 'unstyled';
        const depth = htmlData[1] || 0;
        const text = htmlData[2] || '';
        const data = htmlData[3] || {};

        return new ContentBlock({
            type: type,
            key: genKey(),
            depth: depth,
            data: Map(data),
            text: text,
            characterList: List(Repeat(CharacterMetadata.create({
                style: OrderedSet([]),
                entity: null,
            }), text.length)),
        });
    }));
}

/**
 * @description Creates a contentState containing an atomic block that is a table
 * containing the given cells. If omitted, a default table is returned, containing
 * two rows and three columns.
 * @param {Array<Array>=} cells
 * @returns {Object} Keys 'block' and 'contentState'
 */
export function tableBlockAndContent(cells?) {
    const cs = (txt) => convertToRaw(ContentState.createFromText(txt));

    return createBlockAndContent('TABLE', {
        data: {
            numCols: 3,
            numRows: 2,
            cells: cells || [
                [cs('a'), cs('b'), cs('c')],
                [cs('d'), cs('e'), cs('f')],
            ],
        },
    });
}

/**
 * @name cursorAtPosition
 * @description Takes an editorState and returns it with the selection set to position
 * pos. If 'n' is supplied, pos + n will be the focus of the selection.
 * @param {Number} pos The anchor point of the selection
 * @param {Number=} n The offset for the focus point of the selection (pos+n)
 * @returns {Object} editorState
 */
export function cursorAtPosition(editorState, pos, n = 0) {
    const blockKey = editorState.getCurrentContent()
        .getFirstBlock()
        .getKey();

    return EditorState.forceSelection(editorState, SelectionState.createEmpty(blockKey).merge({
        anchorOffset: pos,
        focusOffset: pos + n,
    }));
}
