import {EditorState, Modifier} from 'draft-js';
import {onChange} from './editor3';
import {createAddSuggestion} from './suggestions';
import {getSuggestionMetadata} from '../actions/suggestions';
import {getCustomDecorator} from '../store';

const spellchecker = (state = {}, action) => {
    switch (action.type) {
    case 'SPELLCHECKER_REPLACE_WORD':
        return replaceWord(state, action.payload);
    case 'SPELLCHECKER_REFRESH_WORD':
        return refreshWord(state, action.payload);
    case 'SPELLCHECKER_AUTO':
        return autoSpellchecker(state, action.payload);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name replaceWord
 * @param {Object} state
 * @param {String} word
 * @return {Object} returns new state
 * @description Replace the current word with the new selected one
 */
export const replaceWord = (state, {word, newWord}, skipOnChange = false) => {
    const {editorState, suggestingMode} = state;

    if (word.text === newWord) {
        return onChange(state, editorState, true);
    }

    if (suggestingMode) {
        const data = getSuggestionMetadata();
        const wordSelection = editorState.getSelection().merge({
            anchorOffset: word.offset,
            focusOffset: word.offset + word.text.length,
            hasFocus: true,
        });

        return createAddSuggestion(state, {text: newWord, data: data}, wordSelection);
    } else {
        const selection = editorState.getSelection();
        const newSelection = selection.merge({
            anchorOffset: word.offset + newWord.length,
            focusOffset: word.offset + newWord.length,
            hasFocus: true,
        });
        let newContent = editorState.getCurrentContent();
        const block = newContent.getBlockForKey(selection.getStartKey());
        const length = word.text.length < newWord.length ? word.text.length : newWord.length;

        for (let i = 0; i < length; i++) {
            const characterSelection = selection.merge({
                anchorOffset: word.offset + i,
                focusOffset: word.offset + i + 1,
                hasFocus: true,
            });
            const inlineStyle = block.getInlineStyleAt(word.offset + i);

            newContent = Modifier.replaceText(newContent, characterSelection, newWord[i], inlineStyle);
        }

        if (word.text.length < newWord.length) {
            // insert remaining text
            const insertSelection = selection.merge({
                anchorOffset: word.offset + word.text.length,
                focusOffset: word.offset + word.text.length,
            });
            const text = newWord.substring(word.text.length);
            const inlineStyle = block.getInlineStyleAt(word.offset + word.text.length - 1);

            newContent = Modifier.replaceText(newContent, insertSelection, text, inlineStyle);
        }

        if (word.text.length > newWord.length) {
            // delete extra text
            const deleteSelection = selection.merge({
                anchorOffset: word.offset + newWord.length,
                focusOffset: word.offset + word.text.length,

            });

            newContent = Modifier.replaceText(newContent, deleteSelection, '');
        }

        let newState = EditorState.push(editorState, newContent, 'spellcheck-change');

        newState = EditorState.acceptSelection(newState, newSelection);

        if (skipOnChange) {
            return {
                ...state,
                editorState: newState,
            };
        }
        return onChange(state, newState);
    }
};

/**
 * @ngdoc method
 * @name refreshWord
 * @param {Object} state
 * @param {String} word
 * @return {Object} returns new state
 * @description Refreshes the current word (usually after having being added to the
 * dictionary).
 */
const refreshWord = (state, word) => replaceWord(state, {word: word, newWord: word.text});

/**
 * @ngdoc method
 * @name autoSpelchecker
 * @param {Object} state
 * @param {Boolean} spellcheckerEnabled True if the autospellchecker should be enabled
 * @return {Object} returns new state
 * @description Disable/enable auto mode for spellchecker.
 */
const autoSpellchecker = (state, spellcheckerEnabled) => {
    const {editorState} = state;
    const decorator = getCustomDecorator(!spellcheckerEnabled);
    const newState = EditorState.set(editorState, {decorator});
    const stateNotChanged = false;

    return {
        ...onChange(state, newState, stateNotChanged),
        spellcheckerEnabled,
    };
};

export default spellchecker;
