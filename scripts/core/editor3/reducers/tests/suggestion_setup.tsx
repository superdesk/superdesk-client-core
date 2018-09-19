import {EditorState, convertFromRaw} from 'draft-js';
import reducer from '../suggestions';
import * as Links from '../../helpers/links';

function prepareRawContent(rawContent) {
    const defaultBlock = {
        entityRanges: [],
        inlineStyleRanges: [],
        depth: 0,
        type: 'unstyled',
        text: '',
        data: {},
    };

    const newRawContent = {
        blocks: [],
        entityMap: {},
        ...rawContent,
    };

    const blocks = newRawContent.blocks.map((block) => ({
        ...defaultBlock,
        ...block,
    }));

    newRawContent.blocks = blocks;

    return newRawContent;
}

export function getInitiaContent(rawContent) {
    return convertFromRaw(prepareRawContent(rawContent));
}

export function getInitialEditorState(rawContent) {
    const content = convertFromRaw(prepareRawContent(rawContent));

    return EditorState.createWithContent(content);
}

export function applySelection(editorState, startBlockIndex?, startOffset?, endBlockIndex?, endOffset?) {
    const content = editorState.getCurrentContent();
    let startBlock = content.getFirstBlock();
    let endBlock = content.getLastBlock();
    let block = startBlock;
    let index = 0;

    while (block != null) {
        if (index === startBlockIndex) {
            startBlock = block;
        }
        if (index === endBlockIndex) {
            endBlock = block;
        }
        block = content.getBlockAfter(block.getKey());
        index++;
    }

    const selection = editorState.getSelection().merge({
        anchorOffset: startOffset == null ? 0 : startOffset,
        anchorKey: startBlock.getKey(),
        focusOffset: endOffset == null ? endBlock.getLength() : endOffset,
        focusKey: endBlock.getKey(),
        isBackward: false,
    });

    return EditorState.acceptSelection(editorState, selection);
}

export function addDeleteSuggestion(editorState, action?, date = new Date(), author = 'author_id') {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: action,
                data: {
                    date: date,
                    author: author,
                },
            },
        },
    );

    return result.editorState;
}

export function addInsertSuggestion(editorState, text, date = new Date(), author = 'author_id') {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'CREATE_ADD_SUGGESTION',
            payload: {
                text: text,
                data: {
                    date: date,
                    author: author,
                },
            },
        },
    );

    return result.editorState;
}

export function addStyleSuggestion(editorState, style, date = new Date(), active = false) {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'CREATE_CHANGE_STYLE_SUGGESTION',
            payload: {
                style: style,
                data: {
                    date: date,
                    author: 'author_id',
                    originalStyle: active ? style : '',
                },
            },
        },
    );

    return result.editorState;
}

export function addBlockStyleSuggestion(editorState, blockType, date = new Date(), active = false) {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'CREATE_CHANGE_BLOCK_STYLE_SUGGESTION',
            payload: {
                blockType: blockType,
                data: {
                    date: date,
                    author: 'author_id',
                    originalStyle: active ? blockType : '',
                },
            },
        },
    );

    return result.editorState;
}

export function addSplitParagraphSuggestion(editorState, date = new Date(), author = 'author_id') {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'CREATE_SPLIT_PARAGRAPH_SUGGESTION',
            payload: {
                data: {
                    date: date,
                    author: author,
                },
            },
        },
    );

    return result.editorState;
}

export function processSuggestion(editorState, type, accepted, date = new Date(), author = 'author_id') {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: accepted ? 'ACCEPT_SUGGESTION' : 'REJECT_SUGGESTION',
            payload: {
                suggestion: {
                    selection: editorState.getSelection(),
                    type: type,
                    date: date,
                    author: 'author suggestion',
                    styleName: type + '-1',
                    blockType: 'H1',
                    originalStyle: '',
                },
                data: {
                    date: date,
                    author: author,
                },
            },
        },
    );

    return result.editorState;
}

export function addLinkSuggestion(editorState, date = new Date(),
    author = 'author_id', url = 'http://wwww.sourcefabric.org') {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'CREATE_LINK_SUGGESTION',
            payload: {
                data: {
                    date: date,
                    author: author,
                    link: {href: url},
                },
            },
        },
    );

    return result.editorState;
}

export function changeLinkSuggestion(editorState, entity, date = new Date(),
    author = 'author_id', url = 'http://dev.sourcefabric.org') {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'CHANGE_LINK_SUGGESTION',
            payload: {
                data: {
                    date: date,
                    author: author,
                },
                link: {href: url},
                entity: entity,
            },
        },
    );

    return result.editorState;
}

export function removeLinkSuggestion(editorState, date = new Date(), author = 'author_id') {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'REMOVE_LINK_SUGGESTION',
            payload: {
                data: {
                    date: date,
                    author: author,
                },
            },
        },
    );

    return result.editorState;
}

export function addLink(editorState, link = 'http://www.sourcefabric.org') {
    return Links.createLink(editorState, link);
}

export function addPasteSuggestion(editorState, content, date = new Date(), author = 'author_id') {
    const result = reducer(
        {
            editorState: editorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        },
        {
            type: 'PASTE_ADD_SUGGESTION',
            payload: {
                data: {
                    date: date,
                    author: author,
                },
                content: content,
            },
        },
    );

    return result.editorState;
}
