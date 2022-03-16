import {
    EditorState,
} from 'draft-js';
import {getEditorFieldCharactersCount} from 'apps/authoring/authoring/components/CharacterCount';
import getFragmentFromSelection from 'draft-js/lib/getFragmentFromSelection';

export function preventInputWhenLimitIsPassed(
    editorState: EditorState,
    newChars: string,
    limit: number,
) {
    const length =
        getEditorFieldCharactersCount(editorState.getCurrentContent().getPlainText(), false) +
        newChars.length -
        getLengthOfSelectedText(editorState);
    const overflow = length - limit;

    return overflow > 0;
}

function getLengthOfSelectedText(editorState: EditorState) {
    const currentSelection = editorState.getSelection();
    const isCollapsed = currentSelection.isCollapsed();

    if (isCollapsed) {
        return 0;
    }

    const selectedFragment = getFragmentFromSelection(editorState);
    const selectedText = selectedFragment?.map((b) => b.getText()).join('') || '';

    return selectedText.length;
}
