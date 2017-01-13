import {SpellcheckerError} from './SpellcheckerError';
import ng from 'core/services/ng';

/**
  * @description Creates the spellchecker docorator for words with error
  */
export const getSpellcheckerDecorators = () => [{
    strategy: spellcheckStrategy,
    component: SpellcheckerError
}];


/**
  * @description For a block check the words that has errors
  */
function spellcheckStrategy(contentBlock, callback) {
    const spellcheck = ng.get('spellcheck');
    const WORD_REGEXP = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g;
    const text = contentBlock.getText();

    let matchArr, start, regex = WORD_REGEXP;

    while ((matchArr = regex.exec(text)) !== null) {
        start = matchArr.index;
        if (!spellcheck.isCorrectWord(matchArr[0])) {
            callback(start, start + matchArr[0].length);
        }
    }
}
