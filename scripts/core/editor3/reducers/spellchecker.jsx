import {EditorState, Modifier} from 'draft-js';
import {onChange} from './editor3';
import {Editor3} from '../components/Editor3';

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
const replaceWord = (state, {word, newWord}) => {
    const {editorState} = state;

    const wordSelection = editorState.getSelection().merge({
        anchorOffset: word.offset,
        focusOffset: word.offset + word.text.length,
        hasFocus: true,
    });

    var newState = Modifier.replaceText(editorState.getCurrentContent(), wordSelection, newWord);

    newState = EditorState.push(editorState, newState, 'spellcheck-change');

    return onChange(state, newState);
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
    const decorator = Editor3.getDecorator(!spellcheckerEnabled);
    const newState = EditorState.set(editorState, {decorator});
    const stateNotChanged = false;

    return {
        ...onChange(state, newState, stateNotChanged),
        spellcheckerEnabled,
    };
};

export default spellchecker;
