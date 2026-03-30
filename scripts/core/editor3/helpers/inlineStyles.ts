import {customEditorControls} from 'core/editor3/CustomEditorControls';
import {EditorState, SelectionState, Modifier} from 'draft-js';

export const inlineStyles = {
    ...Object.fromEntries(
        customEditorControls.getInlineStyles().map((f) => [f.formatOption, f.draftJsStyle]),
    ),
    bold: 'BOLD',
    italic: 'ITALIC',
    underline: 'UNDERLINE',
    subscript: 'SUBSCRIPT',
    superscript: 'SUPERSCRIPT',
    strikethrough: 'STRIKETHROUGH',
};

export const acceptedInlineStyles = Object.values(inlineStyles);

export function sanitizeContent(editorState, styles = acceptedInlineStyles) {
    let contentState = editorState.getCurrentContent();

    const ignoreStyle = (style) => styles.indexOf(style) === -1;
    const getSelection = (block, start, end) => SelectionState.createEmpty(block.getKey()).merge({
        anchorOffset: start,
        focusOffset: end,
    });

    let nextEditorState = editorState;

    contentState.getBlockMap().forEach((block) => {
        block.findStyleRanges(
            (character) => character.getStyle().some(ignoreStyle),
            (start, end) => {
                const selection = getSelection(block, start, end);
                const inlineStyle = block.getInlineStyleAt(start).find(ignoreStyle);

                contentState = Modifier.removeInlineStyle(contentState, selection as SelectionState, inlineStyle);
            },
        );
    });

    nextEditorState = EditorState.push(
        nextEditorState,
        contentState,
        'change-inline-style',
    );

    nextEditorState = EditorState.push(
        nextEditorState,
        contentState,
        'apply-entity',
    );

    return nextEditorState;
}
