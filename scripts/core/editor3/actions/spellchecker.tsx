import {IReplaceWordData} from '../reducers/spellchecker';
import {
    getSpellcheckWarningsByBlock,
    ISpellcheckWarningsByBlock,
} from '../components/spellchecker/SpellcheckerDecorator';
import {IEditorStore} from '../store';
import {getSpellchecker} from '../components/spellchecker/default-spellcheckers';

export function replaceWord(data: IReplaceWordData) {
    return {
        type: 'SPELLCHECKER_REPLACE_WORD',
        payload: data,
    };
}

export function setSpellcheckerStatus(enabled: boolean) {
    if (enabled) {
        return reloadSpellcheckerWarnings();
    } else {
        return disableSpellchecker();
    }
}

export function reloadSpellcheckerWarnings() {
    return function(dispatch, getState) {
        const state: IEditorStore = getState();
        const spellchecker = getSpellchecker(state.spellchecking.language);

        if (spellchecker == null) {
            return;
        }

        getSpellcheckWarningsByBlock(spellchecker, getState().editorState).then((spellcheckWarningsByBlock) => {
            dispatch(applySpellcheck(spellcheckWarningsByBlock));
        });
    };
}

/** *
 * passing language as parameter so that spellchecker runs with currently updated language
 * When we perform undo operation and language gets chnaged state is not updated
 * at time when spellchecker actions are dispatched
 */
export function setSpellcheckerLanguage(language: string) {
    return {
        type: 'SET_SPELLCHEKCER_LANGUAGE',
        payload: language,
    };
}

export function disableSpellchecker() {
    return {
        type: 'DISABLE_SPELLCHECKER',
    };
}

export function applySpellcheck(spellcheckWarningsByBlock: ISpellcheckWarningsByBlock) {
    return {
        type: 'APPLY_SPELLCHECK',
        payload: spellcheckWarningsByBlock,
    };
}

export function setSpellcheckerProgress(inProgress: boolean) {
    return {
        type: 'SET_SPELLCHEKCER_PROGRESS',
        payload: inProgress,
    };
}
