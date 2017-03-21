import React from 'react';
import {
    EditorState,
    ContentState,
    RichUtils,
    SelectionState,
    AtomicBlockUtils,
    convertToRaw
} from 'draft-js';

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
        getState: () => state
    };

    const options = {
        context: {store},
        childContextTypes: {
            store: React.PropTypes.object.isRequired
        }
    };

    return {store, options};
}

/**
 * @name stateWithLink
 * @description Returns a new editorState that has the text "click HERE to open page"
 * as content, having the uppercased letters marked as an entity of type LINK, containing
 * the data {url: 'entity-url'}
 * @returns {Object} editorState
 */
export function stateWithLink() {
    const contentState = ContentState
        .createFromText('click HERE to open page')
        .createEntity('LINK', 'MUTABLE', {url: 'entity-url'});

    const entityKey = contentState.getLastCreatedEntityKey();
    const blockKey = contentState.getFirstBlock().getKey();
    const linkSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 6,
        focusOffset: 9
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
    return createBlockAndContent('IMAGE', {
        img: {
            renditions: {original: {href: 'image_href'}},
            alt_text: 'image_alt_text',
            description_text: 'image_description'
        }
    });
}

/**
 * @description Creates a contentState containing an atomic block with the entity
 * having the given type and containing the given data.
 * @param {String} type Entity type
 * @param {Object} data Entity data
 * @returns {Object} Keys 'block' and 'contentState'
 */
function createBlockAndContent(type, data) {
    const cs = ContentState.createFromText('here is an image:');
    const contentState = cs.createEntity(type, 'MUTABLE', data);
    const entityKey = contentState.getLastCreatedEntityKey();
    const editorState = AtomicBlockUtils.insertAtomicBlock(
        EditorState.createWithContent(contentState),
        entityKey, ' ');
    const block = editorState.getCurrentContent().getBlocksAsArray()[1];

    return {block, contentState};
}

export function embedBlockAndContent() {
    return createBlockAndContent('EMBED', {
        data: {
            html: '<h1>Embed Title</h1>'
        }
    });
}

export function tableBlockAndContent(cells) {
    const cs = (txt) => convertToRaw(ContentState.createFromText(txt));

    return createBlockAndContent('TABLE', {
        data: {
            w: 3,
            h: 2,
            cells: cells || [
                [cs('a'), cs('b'), cs('c')],
                [cs('d'), cs('e'), cs('f')]
            ]
        }
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
        focusOffset: pos + n
    }));
}
