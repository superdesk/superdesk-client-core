import {EditorState, Modifier} from 'draft-js';
import {onChange} from './editor3';
import {createAddSuggestion} from './suggestions';
import {getSuggestionMetadata} from '../actions/suggestions';
import {getCustomDecorator, IEditorStore} from '../store';
import {ISpellcheckWarningsByBlock} from '../components/spellchecker/SpellcheckerDecorator';

const spellchecker = (state: IEditorStore, action) => {
    switch (action.type) {
    case 'SPELLCHECKER_REPLACE_WORD':
        return replaceWord(state, action.payload);
    case 'SET_SPELLCHEKCER_PROGRESS':
        return {...state, spellchecking: {...state.spellchecking, inProgress: action.payload}};
    case 'DISABLE_SPELLCHECKER':
        return applySpellcheck(state.spellchecking.language, false, state);
    case 'SET_SPELLCHEKCER_LANGUAGE':
        return {...state, spellchecking: {...state.spellchecking, language: state.item.language}};
    case 'APPLY_SPELLCHECK':
        return applySpellcheck(state.spellchecking.language, true, state, action.payload);
    default:
        return state;
    }
};

export interface IReplaceWordData {
    word: {
        text: string;
        offset: number;
    };
    newWord: string;
}

/**
 * @ngdoc method
 * @name replaceWord
 * @param {Object} state
 * @param {String} word
 * @return {Object} returns new state
 * @description Replace the current word with the new selected one
 */
export const replaceWord = (state, replaceWordData: IReplaceWordData, skipOnChange = false) => {
    const {editorState, suggestingMode} = state;

    const {word, newWord} = replaceWordData;

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

function applySpellcheck(language: string, enabled: boolean, state: IEditorStore, payload?): IEditorStore {
    const {editorState} = state;
    const spellcheckWarningsByBlock: ISpellcheckWarningsByBlock = payload;

    const nextEditorState = EditorState.set(
        editorState,
        {decorator: enabled ? getCustomDecorator(language, spellcheckWarningsByBlock) : getCustomDecorator()},
    );

    return {
        ...state,
        editorState: nextEditorState,
        spellchecking: {
            ...state.spellchecking,
            enabled: enabled,
            inProgress: false,
            warningsByBlock: enabled ? spellcheckWarningsByBlock : {},
        },
    };
}

export default spellchecker;
