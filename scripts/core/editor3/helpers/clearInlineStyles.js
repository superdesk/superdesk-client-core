import {
    Modifier,
    EditorState
} from 'draft-js';

export function clearInlineStyles(editorState, selection, stylesArray) {
    const contentWithoutStyles = stylesArray.reduce((newContentState, style) => (
        Modifier.removeInlineStyle(
            newContentState,
            selection,
            style
        )
    ), editorState.getCurrentContent());

    return EditorState.push(
        editorState,
        contentWithoutStyles,
        'change-inline-style'
    );
}