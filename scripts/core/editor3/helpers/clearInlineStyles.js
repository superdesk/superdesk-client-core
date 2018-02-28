import {
    Modifier,
    EditorState
} from 'draft-js';

export function clearInlineStyles(editorState, selection, stylesArray) {
    const currentSelectionToPreserve = editorState.getSelection();

    const contentWithoutStyles = stylesArray.reduce((newContentState, style) => (
        Modifier.removeInlineStyle(
            newContentState,
            selection,
            style
        )
    ), editorState.getCurrentContent());

    const editorStateWithInlineStylesCleared = EditorState.push(
        editorState,
        contentWithoutStyles,
        'change-inline-style'
    );

    const editorStateWithSelectionRestored = EditorState.forceSelection(
        editorStateWithInlineStylesCleared,
        currentSelectionToPreserve
    );

    return editorStateWithSelectionRestored;
}