import {EditorState} from "draft-js";

import {ISpellcheckWarning} from '../components/spellchecker/interfaces';
import {getSpellcheckWarnings} from '../components/spellchecker/SpellcheckerDecorator';

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

/**
 * @ngdoc method
 * @name replaceWord
 * @param {String} word
 * @return {String} action
 * @description Creates the replace word action
 */
export function replaceWord(word) {
    return {
        type: 'SPELLCHECKER_REPLACE_WORD',
        payload: word,
    };
}

/**
 * @ngdoc method
 * @name refreshWord
 * @param {String} word
 * @return {String} action
 * @description Refreshes the passed word (usually after having being added
 * to the dictionary).
 */
export function refreshWord(word) {
    return {
        type: 'SPELLCHECKER_REFRESH_WORD',
        payload: word,
    };
}

/**
 * @ngdoc method
 * @name setAutoSpellchecker
 * @param {Boolean} enabled True if the autospellchecker should be enabled
 * @return {String} action
 * @description Enable/disable auto mode for spellchecker.
 */
export function setAutoSpellchecker(enabled) {
    return {
        type: 'SPELLCHECKER_AUTO',
        payload: enabled,
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
