import {EditorState, Modifier} from 'draft-js';

const spellchecker = (state = {}, action) => {
    switch (action.type) {
    case 'SPELLCHECKER_REPLACE_WORD':
        return replaceWord(state, action.payload);
    case 'SPELLCHECKER_SHOW_CONTEXT_MENU':
        return showContextMenu(state, action.payload);
    case 'SPELLCHECKER_CLOSE_CONTEXT_MENU':
        return closeContextMenu(state);
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
const replaceWord = (state, text) => {
    const {editorState, spellcheckerMenu} = state;
    const {word, editorSelection} = spellcheckerMenu;
    const sel = editorSelection.merge({
        anchorOffset: word.offset,
        focusOffset: word.offset + word.text.length
    });

    var newState = Modifier.replaceText(editorState.getCurrentContent(), sel, text);

    newState = EditorState.push(editorState, newState, 'spellchecker');

    return {
        ...state,
        editorState: newState,
        spellcheckerMenu: {
            ...spellcheckerMenu,
            visible: false
        }
    };
};

/**
 * @ngdoc method
 * @name closeContextMenu
 * @param {Object} state
 * @return {Object} returns new state
 * @description Save on store all relevant data for spellchecker context menu
 */
const closeContextMenu = (state) => {
    const {spellcheckerMenu} = state;

    return {
        ...state,
        spellcheckerMenu: {
            ...spellcheckerMenu,
            visible: false
        }
    };
};

/**
 * @ngdoc method
 * @name showContextMenu
 * @param {Object} state
 * @param {String} contextMenuData
 * @return {Object} returns new state
 * @description Save on store all relevant data for spellchecker context menu
 */
const showContextMenu = (state, data) => {
    const {editorState, spellcheckerMenu} = state;

    return {
        ...state,
        spellcheckerMenu: {
            ...spellcheckerMenu,
            ...data,
            visible: true,
            editorSelection: editorState.getSelection()
        }
    };
};

export default spellchecker;
