import React from 'react';
import {SpellcheckerError} from './SpellcheckerError';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SpellcheckerDecorator
 * @param {Function} isCorrectWord callback to validate if a word is correct
 * @param {Function} getSuggestions callback returns the suggestions for a word
 * @description The spellchecker decorator will highlight the words with spellcheck errors
 */

/**
  * @ngdoc method
  * @name SpellcheckerDecorator#getSpellcheckerDecorators
  * @param {Function} isCorrectWord callback to validate if a word is correct
  * @param {Function} getSuggestions callback to generate the suggestions for current word
  * @return {Object} returns the spellchecker decorator
  * @description Creates the spellchecker docorator for words with error
  */
export const getSpellcheckerDecorators = (isCorrectWord, getSuggestions) =>
    [{
        strategy: spellcheckStrategy(isCorrectWord),
        component: (props) => <SpellcheckerError {...props} />,
        props: {
            getSuggestions: getSuggestions
        }
    }];

/**
  * @ngdoc method
  * @name SpellcheckerDecorator#spellcheckStrategy
  * @param {Function} isCorrectWord callback to validate if a word is correct
  * @return {Object} returns the spellchecker strategy
  * @description For a block check the words that has errors
  */
function spellcheckStrategy(isCorrectWord) {
    let WORD_REGEXP = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g;

    return (contentBlock, callback) => {
        const text = contentBlock.getText();
        let matchArr, start, regex = WORD_REGEXP;

        while ((matchArr = regex.exec(text)) !== null) {
            start = matchArr.index;
            if (!isCorrectWord(matchArr[0])) {
                callback(start, start + matchArr[0].length);
            }
        }
    };
}