import {gettext} from 'core/utils';

DictionaryEditController.$inject = ['$scope', 'dictionaries', 'upload', 'notify',
    'modal', '$rootScope', '$q'];
export function DictionaryEditController($scope, dictionaries, upload, notify,
    modal, $rootScope, $q) {
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
    $scope.$on('fileSelected', (event, args) => {
        $scope.$apply(() => {
            $scope.file = args.file;
        });
    });

    $scope.save = function() {
        $scope._errorUniqueness = false;
        $scope.progress = {width: 1};
        if ($scope.file) {
            dictionaries.upload($scope.origDictionary, $scope.dictionary, $scope.file,
                onSuccess, onError, (update) => {
                    $scope.progress.width = Math.round(update.loaded / update.total * 100.0);
                }
            );
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

        if (!search) {
            return;
        }

        var key = search[0].toLowerCase();

        if (!wordsTrie[key]) {
            return;
        }

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
            .then(() => {
                delete $scope.dictionary.content[abbreviation];
                init();
            });
    };

    function confirmAdd() {
        if ($scope.dictionary.content[$scope.abbreviation.key]) {
            return modal.confirm(gettext('Abbreviation already exists. Do you want to overwrite it?'))
                .then(() => true, () => false);
        }

        return $q.when(true);
    }

    $scope.addAbbreviation = function() {
        confirmAdd().then((result) => {
            if (result) {
                $scope.dictionary.content[$scope.abbreviation.key] = $scope.abbreviation.phrase;
                init();
            }
        });
    };

    function init() {
        if ($scope.isAbbreviations()) {
            $scope.abbreviation = {
                key: '', phrase: '',
            };

            $scope.abbreviationKeys = _.sortBy(Object.keys($scope.dictionary.content));
        }
    }

    init();
}
