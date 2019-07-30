import {getSpellchecker} from 'core/editor3/components/spellchecker/default-spellcheckers';

/**
 * Spellcheck module
 */
SpellcheckService.$inject = ['$q', 'api', 'dictionaries', '$rootScope', '$location', 'lodash', 'preferencesService'];
function SpellcheckService($q, api, dictionaries, $rootScope, $location, _, preferencesService) {
    var PREFERENCES_KEY = 'spellchecker:status',
        lang,
        dict = {} as any,
        ignored = {},
        abbreviationList = [],
        self;

    let _activeCache = {};

    self = this;
    self.abbreviationsDict = null;
    self.isAutoSpellchecker = false;
    self.isActiveDictionary = false;

    /**
     * Set current language
     *
     * @param {string} _lang
     */
    this.setLanguage = function(_lang) {
        if (lang !== _lang) {
            lang = _lang;
            dict = {};
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
    this.getDict = getDict;
    function getDict() {
        if (!lang) {
            return $q.reject();
        }

        var baseLang = getBaseLanguage(lang);

        if (Object.keys(dict).length === 0) {
            dict = dictionaries.getActive(lang, baseLang).then((items) => {
                dict = dict || {};
                dict.content = {};

                let langItems = items;

                if (baseLang && _.find(items, {language_id: lang}) && _.find(items, {language_id: baseLang})) {
                    langItems = _.filter(items, {language_id: lang});
                }

                angular.forEach(langItems, addDict);

                // Abbreviations found in dictionary.
                var re = /\w+(?:\.\w*)+/g;

                abbreviationList = _.words(Object.keys(dict.content), re);

                return dict.content;
            });
        }

        return dict;
    }

    /*
     * Return dictionaries for requested language
     *
     * @param {Object} language
     * @returns {Object} List of dictionaries
     */
    this.getDictionary = function(language) {
        if (!_activeCache[language]) {
            _activeCache[language] = dictionaries.getActive(language, getBaseLanguage(language));
        }

        return _activeCache[language];
    };

    /**
     * Get abbreviations for replacement
     *
     * @return {Promise}
     */
    this.getAbbreviationsDict = function(force) {
        if (!lang) {
            // here it shouldn't reject like in getDict, where it would stop only spellchecking
            // if there is no dictionary, while here it would stop scope commit in editor
            return $q.when({});
        }

        var baseLang = getBaseLanguage(lang);

        if (!self.abbreviationsDict || force) {
            return dictionaries.getUserAbbreviations(lang, baseLang).then((items) => {
                self.abbreviationsDict = self.abbreviationsDict || {};
                self.abbreviationsDict.content = {};

                let langItems = items;

                if (baseLang && _.find(items, {language_id: lang}) && _.find(items, {language_id: baseLang})) {
                    langItems = _.filter(items, {language_id: lang});
                }

                angular.forEach(langItems, (item) => {
                    angular.extend(self.abbreviationsDict.content, JSON.parse(item.content) || {});
                });

                return self.abbreviationsDict.content;
            });
        }

        return $q.when(self.abbreviationsDict.content);
    };

    function updateAbbreviations(data) {
        if (self.abbreviationsDict && self.abbreviationsDict.content) {
            angular.extend(self.abbreviationsDict.content, data || {});
        }
    }

    $rootScope.$on('abbreviations:updated', angular.bind(self, (evt, data) => {
        updateAbbreviations(data);
    }));

    /**
     * Reset active dictionary cache
     *
     * When it gets langauge info, only reset it for given langauge,
     * otherwise reset it for all languages.
     *
     * @param {Event} event
     * @param {Object} data
     */
    let _resetActiveCache = (event, data) => {
        if (data.language) {
            _activeCache[data.language] = null;
        } else {
            _activeCache = {};
        }
    };

    $rootScope.$on('dictionary:created', _resetActiveCache);
    $rootScope.$on('dictionary:updated', _resetActiveCache);

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
     * @return {Object} - list of non sentence words.
     *     {
     *       index: word
     *     }
     */
    function getNonSentenceWords(textContent, currentOffset) {
        // words contains one or more periods in content. e.g., E.N.T., Aborig. or etc.
        var reAbbreviations = /\w+(?:\.\w*)+/g;
        var abbreviationWords = _.words(textContent, reAbbreviations);

        // consider only abbreviations in content that found in dictionary
        var _abbrevArr = [];

        _.forEach(abbreviationWords, (abbrevWord) => {
            _.filter(abbreviationList, (item) => {
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

        while (!_.isNil(match = reNonSentenceWords.exec(textContent))) {
            wordIndex = match.index + match[0].indexOf(_.trim(match[1]));
            nonSentenceWords[currentOffset + wordIndex] = _.trim(match[1]);
        }

        return nonSentenceWords;
    }

    /**
     * Get words that contributing beginning of sentences.
     * excluding words that come after an abbreviation.
     *
     * @param {string} textContent
     * @param {integer} currentOffset
     * @return {Object} - list of sentence words.
     *     {
     *       index: word
     *     }
     */
    function getSentenceWords(textContent, currentOffset) {
        var reSentenceWords = /(?:^\s*|(?:[.|?|!|:]\s*))(\w+)/g; // words come after by .|?|!|:
        var match, wordIndex;
        var sentenceWords = {};
        // Replace quotes (",“,”,‘,’,'), that might occur at start/end of sentence/paragraph before applying regex.

        while (!_.isNil(match = reSentenceWords.exec(textContent.replace(/["“”‘’']/g, ' ')))) {
            wordIndex = match.index + match[0].indexOf(match[1]);
            sentenceWords[currentOffset + wordIndex] = match[1];
        }

        // Excluding the words from sentence word if come after an abbreviation.
        var nonSentenceWords = getNonSentenceWords(textContent, currentOffset);

        sentenceWords = _.omit(sentenceWords, Object.keys(nonSentenceWords));

        return sentenceWords;
    }

    /**
     * Test if word exists in dictionary
     *
     * @param {String} word
     * @param {Boolean} i - if true tests case in-sensitive
     * @return {Boolean}
     */
    function wordExistInDict(word: string, i?) {
        if (i) {
            var lowerCaseWord = word.toLowerCase();

            return _.find(Object.keys(dict.content), (val) => val.toLowerCase() === lowerCaseWord);
        }

        return dict.content[word];
    }

    /**
     * Test if word is a spelling mistake
     *
     * @param {String} word
     * @param {Boolean} sentenceWord - it's first word in a sentence
     * @return {Boolean}
     */
    function isSpellingMistake(word, sentenceWord) {
        if (isFirstLetterCapital(word)) {
            // first word, maybe it is in dict with capital, maybe not, check both
            let lowercase = word[0].toLowerCase() + word.slice(1);

            return !wordExistInDict(word) && !wordExistInDict(lowercase);
        } else if (sentenceWord) {
            return true;
        }

        // check it as it is
        return !wordExistInDict(word);
    }

    /**
     * Test if first letter of word is uppercase
     *
     * @param {String} word
     * @return {Boolean}
     */
    function isFirstLetterCapital(word) {
        return word[0] === word[0].toUpperCase();
    }

    /**
     * Find errors in given node
     *
     * @param {Node} node
     */
    this.errors = function check(node) {
        return getDict().then((d) => {
            var errors = [],
                regexp = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g,
                dblSpacesRegExp = /\S(\s{2,})\S/g,
                match,
                dblSpacesMatch,
                currentOffset = 0,
                tree = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);

            var objSentenceWords = getSentenceWords(node.textContent, currentOffset);

            while (tree.nextNode()) {
                while (!_.isNil(dblSpacesMatch = dblSpacesRegExp.exec(tree.currentNode.textContent))) {
                    var dblSpace = dblSpacesMatch[1];

                    errors.push({
                        word: dblSpace,
                        index: currentOffset + dblSpacesMatch.index + 1,
                        sentenceWord: false,
                    });
                }

                while (!_.isNil(match = regexp.exec(tree.currentNode.textContent))) {
                    var word = match[0];
                    var isSentenceWord = !!objSentenceWords[currentOffset + match.index];

                    if (isNaN(word) && !isIgnored(word) && isSpellingMistake(word, isSentenceWord)) {
                        errors.push({
                            word: word,
                            index: currentOffset + match.index,
                            sentenceWord: isSentenceWord,
                        });
                    }
                }
                currentOffset += tree.currentNode['length'];
            }

            return errors;
        });
    };

    /**
     * Get suggested corrections for given word
     *
     * @param {string} word
     */
    this.suggest = function suggest(word) {
        if (word.match(/^\s+$/i)) {
            return Promise.resolve([{key: ' ', value: 'Add single space'}]);
        }

        return api.save('spellcheck', {
            word: word,
            language_id: lang,
        }).then((result) => {
            var allDict = getDict();
            var wordFoundInDict = _.pick(allDict.content, (value, key) => {
                if (key.toLowerCase() === word.toLowerCase()) {
                    return key;
                }
            });

            angular.extend(result.corrections, Object.keys(wordFoundInDict));

            return result.corrections.map((key) => ({key: key, value: key}));
        });
    };

    /**
     * Add word to user dictionary
     *
     * @param {String} word
     */
    this.addWordToUserDictionary = addWordToUserDictionary;
    function addWordToUserDictionary(word) {
        dictionaries.addWordToUserDictionary(word, lang);
        dict.content[word] = dict.content[word] ? dict.content[word] + 1 : 1;
    }

    /**
     * Ignore word when spellchecking
     *
     * @param {String} word
     */
    this.ignoreWord = ignoreWord;
    function ignoreWord(word) {
        getItemIgnored()[word] = 1;
    }

    /**
     * Test if given word is in ingored
     *
     * @param {String} word
     * @return {Boolean}
     */
    function isIgnored(word) {
        return !!getItemIgnored()[word];
    }

    /**
     * Get ignored collection for current item
     *
     * @return {Object}
     */
    function getItemIgnored() {
        var item = $location.search().item || '';

        ignored[item] = ignored[item] || {};
        return ignored[item];
    }

    /**
     * Add word to regular or ignored dictionary
     *
     * @param {String} word
     * @param {String} isBeingIgnored
     */
    this.addWord = function addWord(word, isBeingIgnored) {
        if (isBeingIgnored) {
            ignoreWord(word);
        } else {
            addWordToUserDictionary(word);
        }
    };

    /**
     * Check if the current word is correct
     *
     * @param {String} text
     */
    this.isCorrectWord = function isCorrectWord(word) {
        // TODO: calculate isSentenceWord
        var isSentenceWord = false;

        return !isNaN(word) || !dict.content || isIgnored(word) || !isSpellingMistake(word, isSentenceWord);
    };

    // reset ignore list for an item if it was unlocked
    $rootScope.$on('item:unlock', (event, data) => {
        if (ignored.hasOwnProperty(data.item)) {
            ignored[data.item] = {};
        }
    });

    /**
     * Get the spell checker status
     */
    this.getSpellcheckerStatus = function getSpellcheckerStatus() {
        var status = true;

        return preferencesService.get(PREFERENCES_KEY).then((result) => {
            if (angular.isDefined(result)) {
                status = result.enabled;
            }
            return status;
        }, (error) => status);
    };

    /**
     * Set the spell checker status
     */
    this.setSpellcheckerStatus = function setSpellcheckerStatus(status) {
        var updates = {};

        self.isAutoSpellchecker = status;

        updates[PREFERENCES_KEY] = {
            type: 'bool',
            enabled: status,
            default: true,
        };

        preferencesService.update(updates, PREFERENCES_KEY);
    };

    this.getSpellcheckerStatus().then((status) => {
        self.isAutoSpellchecker = status;
    });
}

SpellcheckMenuController.$inject = ['$rootScope', 'editorResolver', 'spellcheck', 'notify', '$scope'];
function SpellcheckMenuController($rootScope, editorResolver, spellcheck, notify, $scope) {
    this.isAuto = false;
    this.runSpellchecker = runSpellchecker;
    this.pushSettings = pushSettings;
    var self = this;

    /**
     * Force spell ckecking
     */
    function runSpellchecker() {
        if (!spellcheck.isActiveDictionary && getSpellchecker($scope.item.language) == null) {
            notify.error(gettext('No dictionary available for spell checking.'));
            return;
        }

        const editor = editorResolver.get();

        if (editor && editor.version() === '3') {
            // on editor3 set auto spellcheck when the spellcheck is run
            self.isAuto = true && !useTansaProofing();
            pushSettings();
        } else {
            editor.render(true);
        }
    }

    /**
     * render the editor based on the spell check settings.
     */
    function render() {
        const editor = editorResolver.get();

        editor.setSettings({spellcheck: self.isAuto, language: $scope.item.language});
        editor.render();
    }

    /**
     * update the editor and preferences
     */
    function pushSettings() {
        render();
        spellcheck.setSpellcheckerStatus(self.isAuto);
    }

    /**
     * check if tansa is activated
     */
    function useTansaProofing() {
        return $rootScope.config.features && $rootScope.config.features.useTansaProofing;
    }

    $scope.$watch('item.language', (newVal, oldVal) => {
        if (newVal != null && newVal !== oldVal) {
            self.isAuto = true;
            spellcheck.setLanguage(newVal);
            spellcheck.setSpellcheckerStatus(self.isAuto);
            setupSpellchecker();
        }
    });

    function setupSpellchecker() {
        spellcheck.getDictionary($scope.item.language).then((dict) => {
            spellcheck.isActiveDictionary = !!dict.length;

            if (!spellcheck.isActiveDictionary && getSpellchecker($scope.item.language) == null) {
                spellcheck.setSpellcheckerStatus(spellcheck.isActiveDictionary);
                self.isAuto = false;
                render();
            } else {
                spellcheck.getSpellcheckerStatus().then((status) => {
                    self.isAuto = status && !useTansaProofing()
                        && (spellcheck.isActiveDictionary || getSpellchecker($scope.item.language) != null);
                    if (self.isAuto) {
                        runSpellchecker();
                    } else {
                        render();
                    }
                });
            }
        });
    }
    setupSpellchecker();
}

angular.module('superdesk.apps.spellcheck', ['superdesk.apps.dictionaries'])
    .service('spellcheck', SpellcheckService)
    .controller('SpellcheckMenu', SpellcheckMenuController);
