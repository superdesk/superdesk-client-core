/**
 * Spellcheck module
 */
(function() {

'use strict';

SpellcheckService.$inject = ['$q', 'api', 'dictionaries'];
function SpellcheckService($q, api, dictionaries) {
    var lang,
        dict,
        abbreviationList = [],
        numberOfErrors,
        self;

    self = this;

    /**
     * Set current language
     *
     * @param {string} _lang
     */
    this.setLanguage = function(_lang) {
        if (lang !== _lang) {
            lang = _lang;
            dict = null;
        }
    };

    /**
     * Gets the base language (en) of different culture
     * specific (en-AU) language
     *
     * @param {string} language
     * @return {string}
     */
    function getBaseLanguage(language) {
        if (language && language.indexOf('-') > 0) {
            return language.split('-')[0];
        }
        return null;
    }

    /**
     * Get dictionary for spellchecking
     *
     * @return {Promise}
     */
    function getDict() {
        if (!lang) {
            return $q.reject();
        }

        var baseLang = getBaseLanguage(lang);

        if (!dict) {
            dict = dictionaries.getActive(lang, baseLang).then(function(items) {
                dict.content = {};

                if (baseLang && _.find(items, {'language_id': lang}) && _.find(items, {'language_id': baseLang})) {
                    items = _.filter(items, {'language_id': lang});
                }

                angular.forEach(items, addDict);

                // Abbreviations found in dictionary.
                var re = /\w+(?:\.\w*)+/g;
                abbreviationList = _.words(Object.keys(dict.content), re);

                return dict.content;
            });
        }

        return dict;
    }

    /**
     * Add dictionary content to spellcheck
     *
     * @param {Object} item
     */
    function addDict(item, _lang) {
        angular.extend(dict.content, item.content || {});
    }

    /**
     * Get words that come after an abbreviation.
     *
     * @param {string} textContent
     * @param {integer} currentOffset
     * @return {Array.<Object>} Array of Object:
     *     {
     *       word,
     *       index
     *     }
     */
    function getNonSentenceWords(textContent, currentOffset) {
        // words contains one or more periods in content. e.g., E.N.T., Aborig. or etc.
        var reAbbreviations = /\w+(?:\.\w*)+/g;
        var abbreviationWords = _.words(textContent, reAbbreviations);

        // consider only abbreviations in content that found in dictionary
        var _abbrevArr = [];
        _.forEach(abbreviationWords, function(abbrevWord) {
            _.filter(abbreviationList, function(item) {
                if (item === abbrevWord) {
                    _abbrevArr.push(abbrevWord);
                }
            });
        });
        var _abbreviationString = _abbrevArr.join('|');

        // Prepare non sentence words
        var match, wordIndex;
        var nonSentenceWords = [];

        // Words that come after an abbreviation in content.
        var _reNonSentenceWords = '\\s+(?:' + _abbreviationString + ')(\\s+\\w+)';
        var reNonSentenceWords = new RegExp(_reNonSentenceWords, 'g');
        while ((match = reNonSentenceWords.exec(textContent)) != null) {
            wordIndex = match.index + match[0].indexOf(_.trim(match[1]));
            nonSentenceWords.push({
                word: _.trim(match[1]),
                index: currentOffset + wordIndex
            });
        }

        return nonSentenceWords;
    }

    /**
     * Get words that contributing beginning of sentences.
     * excluding words that come after an abbreviation.
     *
     * @param {string} textContent
     * @param {integer} currentOffset
     * @return {Array.<Object>} Array of Object:
     *     {
     *       word,
     *       index
     *     }
     */
    function getSentenceWords(textContent, currentOffset) {
        var reSentenceWords = /(?:^|(?:[.|?|!]\s+))(\w+)/g; // words come after by .|?|!
        var match, wordIndex;
        var sentenceWords = [];
        while ((match = reSentenceWords.exec(textContent)) != null) {
            wordIndex = match.index + match[0].indexOf(match[1]);
            sentenceWords.push({
                word: match[1],
                index: currentOffset + wordIndex
            });
        }

        // Excluding the words from sentence word if come after an abbreviation.
        var nonSentenceWords = getNonSentenceWords(textContent, currentOffset);

        _.forEach(nonSentenceWords, function(nonSentenceWord) {
            _.remove(sentenceWords, {index: nonSentenceWord.index, word: nonSentenceWord.word});
        });

        return sentenceWords;
    }

    // Case in-sensitive search if 'i' option provided.
    function wordExistInDict(word, i) {
        var result = {};
        if (i) {
            result = _.pick(dict.content, function(value, key) {
                return key.toLowerCase() === word.toLowerCase();
            });
        } else {
            result = _.pick(dict.content, function(value, key) {
                return key === word;
            });
        }
        return !_.isEmpty(result);
    }

    // Verify if the word exist in dictionary and the first letter is capital in case of sentence word.
    function verifyDictWord(word, index, objSentenceWord) {
        if (index === 0) {
            if (!isFirstLetterCapital(word)) {
                return false;
            } else {
                return wordExistInDict(word, 'i');
            }
        } else {
            if (!_.isEmpty(objSentenceWord)) {
                if (isFirstLetterCapital(objSentenceWord[0].word)) {
                    return wordExistInDict(word, 'i');
                } else {
                    return false;
                }
            }
            return dict.content[word];
        }
    }

    function isFirstLetterCapital(word) {
        return word[0] === word[0].toUpperCase();
    }

    /**
     * Find errors in given node
     *
     * @param {Node} node
     */
    this.errors = function check(node) {
        return getDict().then(function(d) {
            var errors = [],
                regexp = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g,
                match,
                currentOffset = 0,
                tree = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);

            while (tree.nextNode()) {
                var objSentenceWords = getSentenceWords(tree.currentNode.textContent, currentOffset);
                while ((match = regexp.exec(tree.currentNode.textContent)) != null) {
                    var word = match[0];
                    var objSentenceWord = _.filter(objSentenceWords, {index: currentOffset + match.index});
                    var isSentenceWord = match.index === 0 ? true : !_.isEmpty(objSentenceWord);

                    if (isNaN(word) && !verifyDictWord(word, match.index, objSentenceWord)) {
                        errors.push({
                            word: word,
                            index: currentOffset + match.index,
                            sentenceWord: isSentenceWord
                        });
                    }
                }
                currentOffset += tree.currentNode.length;
            }

            numberOfErrors = errors.length;
            return errors;
        });
    };

    /**
     * Get suggested corrections for given word
     *
     * @param {string} word
     */
    this.suggest = function suggest(word) {
        return api.save('spellcheck', {
            word: word,
            language_id: lang
        }).then(function(result) {
            var allDict = getDict();
            var wordFoundInDict = _.pick(allDict.content, function(value, key) {
                if (key.toLowerCase() === word.toLowerCase()) {
                    return key;
                }
            });
            angular.extend(result.corrections, Object.keys(wordFoundInDict));
            return result.corrections || [];
        });
    };

    /**
     * Add word to user dictionary
     */
    this.addWordToUserDictionary = function(word) {
        word = word.toLowerCase();
        dictionaries.addWordToUserDictionary(word, lang);
        dict.content[word] = dict.content[word] ? dict.content[word] + 1 : 1;
    };
}

SpellcheckMenuController.$inject = ['editor', '$rootScope'];
function SpellcheckMenuController(editor, $rootScope) {
    this.isAuto = editor.settings.spellcheck;
    this.spellcheck = spellcheck;
    this.pushSettings = pushSettings;

    var self = this;

    function spellcheck() {
        editor.render(true);
    }

    function pushSettings() {
        editor.setSettings({spellcheck: self.isAuto});
        editor.render();
    }
}

angular.module('superdesk.editor.spellcheck', ['superdesk.dictionaries'])
    .service('spellcheck', SpellcheckService)
    .controller('SpellcheckMenu', SpellcheckMenuController)
    ;

})();
