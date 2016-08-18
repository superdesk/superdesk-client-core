/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

DictionaryService.$inject = ['api', 'urls', 'session', 'Upload', '$q'];
function DictionaryService(api, urls, session, Upload, $q) {
    this.dictionaries = null;
    this.currDictionary = null;

    this.getActive = getActive;
    this.getUserDictionary = getUserDictionary;
    this.addWordToUserDictionary = addWordToUserDictionary;
    this.getUserAbbreviations = getUserAbbreviations;

    function setPersonalName (data) {
        if (data.user) {
            data.name = data.user + ':' + data.language_id;
        }
    }

    this.fetch = function (success, error) {
        return session.getIdentity().then(function(identity) {
            return api.query('dictionaries', {
                projection: {content: 0},
                where: {
                    $or: [
                        {user: {$exists: false}},
                        {user: identity._id}
                    ]}
            })
            .then(success, error);
        });
    };

    this.open = function (dictionary, success, error) {
        return api.find('dictionaries', dictionary._id).then(success, error);
    };

    this.upload = function (dictionary, data, file, success, error, progress) {
        var hasId = _.has(dictionary, '_id') && dictionary._id !== null;
        var method = hasId ? 'PATCH' : 'POST';
        var headers = hasId ? {'If-Match': dictionary._etag} : {};
        var sendData = {};

        // pick own properties
        angular.forEach(data, function(val, key) {
            if (key !== 'content' && key[0] !== '_') {
                sendData[key] = val === null ? val: val.toString();
            }
        });
        setPersonalName(sendData);

        // send content as content_list which will accept string and will json.parse it later
        // (we send it as form data so each field is not parsed and it would fail list validation)
        if (data.hasOwnProperty('content')) {
            sendData.content_list = angular.toJson(data.content);
        }

        urls.resource('dictionaries').then(function(uploadURL) {
            if (hasId) {
                uploadURL += '/' + dictionary._id;
            }
            return Upload.upload({
                url: uploadURL,
                method: method,
                data: sendData,
                file: file,
                headers: headers
            }).then(success, error, progress);
        }, error);
    };

    this.update = function (dictionary, data, success, error) {
        var sendData = {};
        angular.forEach(data, function(val, key) {
            if (key[0] !== '_') {
                sendData[key] = key === 'is_active' ? val.toString() : val;
            }
        });

        setPersonalName(sendData);
        return api.save('dictionaries', dictionary, sendData).then(success, error);
    };

    this.remove = function (dictionary, success, error) {
        return api.remove(dictionary).then(success, error);
    };

    this.isAbbreviationsDictionary = function(dict) {
        return dict && dict.type === 'abbreviations';
    };

    /**
     * Get list of active abbreviations for given lang
     *
     * @param {string} lang
     */
    function getUserAbbreviations(lang, baseLang) {
        return session.getIdentity().then(function(identity) {
            var languageIds = [{language_id: lang}];
            if (baseLang) {
                languageIds.push({language_id: baseLang});
            }

            return api.query('dictionaries', {
                where: {$and:
                    [{$or: languageIds},
                    {is_active: 'true'},
                    {type: 'abbreviations'},
                    {user: identity._id}]
                }}).then(function(items) {
                    return items._items;
                });
        });
    }

    /**
     * Get list of active dictionaries for given lang
     *
     * @param {string} lang
     */
    function getActive(lang, baseLang) {
        return session.getIdentity().then(function(identity) {
            var languageIds = [{language_id: lang}];
            if (baseLang) {
                languageIds.push({language_id: baseLang});
            }

            return api.query('dictionaries', {
                projection: {content: 0},
                where: {$and:
                    [{$or: languageIds},
                    {is_active: {$in: ['true', null]}},
                    {$or: [{type: {$exists: 0}}, {type: 'dictionary'}]},
                    {$or: [{user: identity._id}, {user: {$exists: false}}]}]
                }}).then(function(items) {
                    return $q.all(items._items.map(fetchItem));
                });
        });

        function fetchItem(item) {
            return api.find('dictionaries', item._id);
        }
    }

    /**
     * Get user dictionary for given language
     *
     * @param {string} lang
     */
    function getUserDictionary(lang) {
        return session.getIdentity().then(function(identity) {
            var where = {
                where: {
                    $and: [
                        {language_id: lang}, {user: identity._id},
                        {$or: [{type: {$exists: 0}}, {type: 'dictionary'}]}
                    ]
                }
            };
            return api.query('dictionaries', where)
                .then(function(response) {
                    return response._items.length ? response._items[0] : {
                        name: identity._id + ':' + lang,
                        content: {},
                        language_id: lang,
                        user: identity._id
                    };
                });
        });
    }

    /**
     * Add word to user dictionary
     *
     * @param {string} word
     * @param {string} lang
     */
    function addWordToUserDictionary(word, lang) {
        return getUserDictionary(lang).then(function(userDict) {
            var words = userDict.content || {};
            words[word] = words[word] ? words[word] + 1 : 1;
            userDict.content = words;
            return api.save('dictionaries', userDict);
        });
    }
}

DictionaryConfigController.$inject = ['$scope', 'dictionaries', 'gettext', 'session', 'modal', 'notify'];
function DictionaryConfigController ($scope, dictionaries, gettext, session, modal, notify) {
    $scope.dictionaries = null;
    $scope.origDictionary = null;
    $scope.dictionary = null;

    $scope.isAdmin = function() {
        return session.identity.user_type === 'administrator';
    };

    $scope.fetchDictionaries = function() {
        dictionaries.fetch(function(result) {
            if (!$scope.isAdmin()) {
                $scope.dictionaries = _.filter(result._items, function(f) {
                    return f.user === session.identity._id;
                });
            } else {
                $scope.dictionaries = result._items;
            }
        });
    };

    $scope.createDictionary = function() {
        $scope.dictionary = {is_active: 'true'};
        $scope.origDictionary = {
            type: 'dictionary'
        };
    };

    $scope.createPersonalDictionary = function() {
        return session.getIdentity().then(function(identity) {
            $scope.dictionary = {
                is_active: 'true',
                type: 'dictionary',
                user: identity._id,
                name: identity._id
            };
            $scope.origDictionary = {};
        });
    };

    $scope.isAbbreviations = function(dict) {
        return dictionaries.isAbbreviationsDictionary(dict);
    };

    $scope.createAbbreviationsDictionary = function() {
        return session.getIdentity().then(function(identity) {
            $scope.dictionary = {
                is_active: 'true',
                type: 'abbreviations',
                user: identity._id,
                name: identity._id,
                content: {}
            };
            $scope.origDictionary = {};
        });
    };

    $scope.openDictionary = function(dictionary) {
        $scope.loading = true;
        dictionaries.open(dictionary, function(result) {
            $scope.origDictionary = result;
            $scope.dictionary = Object.create(result);
            $scope.dictionary.content = Object.create(result.content || {});
            $scope.dictionary.is_active = result.is_active !== 'false';

            if ($scope.isAbbreviations(result)) {
                $scope.dictionary.content = result.content || {};
            }
        });
    };

    $scope.stopLoading = function() {
        $scope.loading = false;
    };

    $scope.closeDictionary = function() {
        $scope.dictionary = $scope.origDictionary = null;
    };

    $scope.remove = function(dictionary) {
        modal.confirm(gettext('Please confirm you want to delete dictionary.')).then(
            function runConfirmed() {
                dictionaries.remove(dictionary, function() {
                    _.remove($scope.dictionaries, dictionary);
                    notify.success(gettext('Dictionary deleted.'), 3000);
                });
            }
        );
    };

    $scope.fetchDictionaries();
}

DictionaryEditController.$inject = ['$scope', 'dictionaries', 'upload', 'gettext', 'notify', 'modal', '$rootScope', '$q'];
function DictionaryEditController ($scope, dictionaries, upload, gettext, notify, modal, $rootScope, $q) {

    function onSuccess(result) {
        if ($scope.isAbbreviations()) {
            $rootScope.$broadcast('abbreviations:updated', result.content);
        }
        $scope.closeDictionary();
        $scope.fetchDictionaries();
        notify.success(gettext('Dictionary saved successfully'));
        $scope.progress = null;
        return result;
    }

    function onError(response) {
        if (angular.isDefined(response.data._issues)) {
            if (angular.isDefined(response.data._issues['validator exception'])) {
                notify.error(gettext('Error: ' + response.data._issues['validator exception']));
            } else if (angular.isDefined(response.data._issues.name)) {
                notify.error(gettext('Error: The dictionary already exists.'));
                $scope._errorUniqueness = true;
            }
        } else {
            notify.error(gettext('Error. Dictionary not saved.'));
        }
        $scope.progress = null;
    }

    // listen for the file selected event
    $scope.$on('fileSelected', function (event, args) {
        $scope.$apply(function() {
            $scope.file = args.file;
        });
    });

    $scope.save = function() {
        $scope._errorUniqueness = false;
        $scope.progress = {width: 1};
        if ($scope.file) {
            dictionaries.upload($scope.origDictionary, $scope.dictionary, $scope.file, onSuccess, onError, function(update) {
                $scope.progress.width = Math.round(update.loaded / update.total * 100.0);
            });
        } else {
            dictionaries.update($scope.origDictionary, $scope.dictionary, onSuccess, onError);
        }
    };

    $scope.cancel = function() {
        $scope._errorUniqueness = false;
        $scope.closeDictionary();
    };

    $scope.addWord = function(word) {
        if (!$scope.dictionary.content.hasOwnProperty(word)) {
            addWordToTrie(word);
        }

        $scope.dictionary.content[word] = 1;
        $scope.filterWords(word);
        $scope.wordsCount++;
    };

    $scope.removeWord = function(word, search) {
        $scope.dictionary.content[word] = 0;
        $scope.filterWords(search);
        $scope.wordsCount--;
    };

    $scope.stopLoading = $scope.stopLoading || angular.noop;

    function isPrefix(prefix, word) {
        return word.length >= prefix.length && word.substr(0, prefix.length).toLowerCase() === prefix.toLowerCase();
    }

    $scope.filterWords = function filterWords(search) {
        $scope.words = [];
        $scope.isNew = !!search;
        if (search) {
            var key = search[0].toLowerCase();
            if (wordsTrie[key]) {
                var searchWords = wordsTrie[key],
                    length = searchWords.length,
                    words = [],
                    word;
                for (var i = 0; i < length; i++) {
                    word = searchWords[i];
                    if ($scope.dictionary.content[word] > 0 && isPrefix(search, word)) {
                        words.push(word);
                        if (word === search) {
                            $scope.isNew = false;
                        }
                    }
                }
                words.sort();
                $scope.words = words;
            }
        }
    };

    var wordsTrie = {};
    $scope.wordsCount = 0;
    generateTrie();
    $scope.stopLoading();

    function addWordToTrie(word) {
        var key = word[0].toLowerCase();
        if (wordsTrie.hasOwnProperty(key)) {
            wordsTrie[key].push(word);
        } else {
            wordsTrie[key] = [word];
        }
    }

    function generateTrie() {
        var content = $scope.origDictionary.content || $scope.dictionary.content;
        var words = Object.keys(content || {});
        $scope.wordsCount = words.length;
        for (var i = 0; i < $scope.wordsCount; i++) {
            addWordToTrie(words[i]);
        }
    }

    $scope.isAbbreviations = function() {
        return dictionaries.isAbbreviationsDictionary($scope.dictionary);
    };

    $scope.editAbbreviations = function(abbreviation, phrase) {
        $scope.dictionary.content[abbreviation] = phrase;
    };

    $scope.removeAbbreviation = function(abbreviation) {
        modal.confirm(gettext('Do you want to remove Abbreviation?'))
            .then(function() {
                delete $scope.dictionary.content[abbreviation];
                init();
            });
    };

    function confirmAdd() {
        if ($scope.dictionary.content[$scope.abbreviation.key]) {
            return modal.confirm(gettext('Abbreviation already exists. Do you want to overwrite it?'))
                .then(function() {
                    return true;
                }, function() {
                    return false;
                });
        } else {
            return $q.when(true);
        }
    }

    $scope.addAbbreviation = function() {
        confirmAdd().then(function(result) {
            if (result) {
                $scope.dictionary.content[$scope.abbreviation.key] = $scope.abbreviation.phrase;
                init();
            }
        });
    };

    function init() {
        if ($scope.isAbbreviations()) {
            $scope.abbreviation = {
                key: '', phrase: ''
            };

            $scope.abbreviationKeys = _.sortBy(Object.keys($scope.dictionary.content));
        }
    }

    init();
}

var app = angular.module('superdesk.dictionaries', [
    'vs-repeat',
    'superdesk.activity',
    'superdesk.upload'
]);

app
    .config(['superdeskProvider', function(superdesk) {
        superdesk
        .activity('/settings/dictionaries', {
                label: gettext('Dictionaries'),
                controller: DictionaryConfigController,
                templateUrl: 'scripts/superdesk-dictionaries/views/settings.html',
                category: superdesk.MENU_SETTINGS,
                priority: -800,
                privileges: {dictionaries: 1}
            });
    }])
    .service('dictionaries', DictionaryService)
    .controller('DictionaryEdit', DictionaryEditController)
    .directive('sdDictionaryConfig', function() {
        return {controller: DictionaryConfigController};
    })
    .directive('sdDictionaryConfigModal', function() {
        return {
            controller: 'DictionaryEdit',
            require: '^sdDictionaryConfig',
            templateUrl: 'scripts/superdesk-dictionaries/views/dictionary-config-modal.html'
        };
    }).directive('fileUpload', function () {
        return {
            scope: true,
            link: function (scope, element, attrs) {
                element.bind('change', function (event) {
                    scope.$emit('fileSelected', {file: event.target.files[0]});
                });
            }
        };
    });
