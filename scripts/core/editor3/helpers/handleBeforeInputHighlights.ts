import {EditorState, Modifier, CharacterMetadata} from 'draft-js';
import {List} from 'immutable';
import {uniq} from 'lodash';

import {getDraftCharacterListForSelection} from './getDraftCharacterListForSelection';
import {resizeDraftSelection} from './resizeDraftSelection';
import {styleNameBelongsToHighlight} from './highlights';

/**
 * @ngdoc method
 * @name addCommentsForServer
 * @param {EditorState} editorState
 * @param {SelectionState} collapsedSelection
 * @return {List<CharacterMetadata>}
 */
function getRelevantCharactersForCollapsedSelection(editorState, collapsedSelection) {
    let characters: any = List();
    const selectionAtTheStartOfTheLine = editorState.getSelection().getStartOffset() === 0;
    const resizeLeft = selectionAtTheStartOfTheLine ? 2 : 1; // SDESK-2861

    const resizedSelection = resizeDraftSelection(resizeLeft, 1, collapsedSelection, editorState, false);
    const resizeLeftFailed = collapsedSelection.getStartOffset() === resizedSelection.getStartOffset();
    const resizeRightFailed = collapsedSelection.getEndOffset() === resizedSelection.getEndOffset();

    if (resizeLeftFailed === true) {
        characters = characters.push(CharacterMetadata.create());
    }

    characters = characters.concat(getDraftCharacterListForSelection(editorState, resizedSelection));

    if (resizeRightFailed === true) {
        characters = characters.push(CharacterMetadata.create());
    }

    return characters;
}

/**
 * @ngdoc method
 * @name handleBeforeInputHighlights
 * @description prevents inheriting of highlight styles
 */
export function handleBeforeInputHighlights(onChange, chars, editorState) {
    // see handleBeforeInputHighlights.spec.gif

    const selection = editorState.getSelection();

    const characterList = selection.isCollapsed()
        ? getRelevantCharactersForCollapsedSelection(editorState, selection)
        : getDraftCharacterListForSelection(editorState, selection);

    const characterStyles = characterList.map((character) => character.getStyle()).toJS();

    const allHighlightStyles = uniq(characterStyles.reduce((a, b) => a.concat(b)))
        .filter(styleNameBelongsToHighlight);

    if (allHighlightStyles.length < 1) {
        return 'not-handled';
    }

    const commonHighlightStyles = allHighlightStyles.filter(
        (styleName) => characterStyles.every((stylesAtPosition) => stylesAtPosition.includes(styleName)),
    );

    const nextInlineStyles = editorState.getCurrentInlineStyle()
        .filter((styleName) => styleNameBelongsToHighlight(styleName) === false)
        .concat(commonHighlightStyles);

    const nextContentstate = Modifier.replaceText(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        chars,
        nextInlineStyles,
    );
    const nextEditorState = EditorState.push(editorState, nextContentstate, 'insert-characters');

    onChange(nextEditorState);

    return 'handled';
}
