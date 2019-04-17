import {EditorState} from "draft-js";

import {ISpellcheckWarning} from '../components/spellchecker/interfaces';
import {getSpellcheckWarnings} from '../components/spellchecker/SpellcheckerDecorator';
import {IReplaceWordData} from "../reducers/spellchecker";

export type ISpellcheckWarningsByBlock = {[blockKey: string]: Array<ISpellcheckWarning>};

export function getSpellcheckWarningsByBlock(editorState: EditorState): Promise<ISpellcheckWarningsByBlock> {
    const rangesByBlock: Array<{blockKey: string, startOffset: number, endOffset: number}> = [];

    let lastOffset = 0;
    const blocks = editorState.getCurrentContent().getBlocksAsArray();

    blocks.forEach((block, i) => {
        const blockLength = block.getLength();
        rangesByBlock.push({
            blockKey: block.getKey(), startOffset: lastOffset, endOffset: lastOffset + blockLength,
        });
        lastOffset += blockLength;
    });

    const text = editorState.getCurrentContent().getPlainText();

    return getSpellcheckWarnings(text).then((warnings) => {
        let spellcheckWarningsByBlock: ISpellcheckWarningsByBlock = {};

        warnings.forEach((warning) => {
            const range = rangesByBlock.find(({startOffset, endOffset}) =>
                warning.startOffset >= startOffset && warning.startOffset < endOffset);

            const {blockKey} = range;

            if (spellcheckWarningsByBlock[blockKey] == null) {
                spellcheckWarningsByBlock[blockKey] = [];
            }
            spellcheckWarningsByBlock[blockKey].push({
                ...warning,
                startOffset: warning.startOffset - range.startOffset,
            });
        });

        return spellcheckWarningsByBlock;
    });
}

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
        getSpellcheckWarningsByBlock(getState().editorState).then((spellcheckWarningsByBlock) => {
            dispatch(applySpellcheck(spellcheckWarningsByBlock));
        });
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
