import _ from 'lodash';

DictionaryConfigController.$inject = ['$scope', 'dictionaries', 'session', 'modal', 'notify'];
export function DictionaryConfigController($scope, dictionaries, session, modal, notify) {
    $scope.dictionaries = null;
    $scope.origDictionary = null;
    $scope.dictionary = null;

    $scope.isAdmin = function() {
        return session.identity.user_type === 'administrator';
    };

    $scope.fetchDictionaries = function() {
        dictionaries.fetch((result) => {
            if (!$scope.isAdmin()) {
                $scope.dictionaries = _.filter(result._items, (f) => f.user === session.identity._id);
            } else {
                $scope.dictionaries = result._items;
            }
        });
    };

    $scope.createDictionary = function() {
        $scope.dictionary = {is_active: 'true'};
        $scope.origDictionary = {
            type: 'dictionary',
        };
    };

    $scope.createPersonalDictionary = function() {
        return session.getIdentity().then((identity) => {
            $scope.dictionary = {
                is_active: 'true',
                type: 'dictionary',
                user: identity._id,
                name: identity._id,
            };
            $scope.origDictionary = {};
        });
    };

    $scope.isAbbreviations = function(dict) {
        return dictionaries.isAbbreviationsDictionary(dict);
    };

    $scope.createAbbreviationsDictionary = function() {
        return session.getIdentity().then((identity) => {
            $scope.dictionary = {
                is_active: 'true',
                type: 'abbreviations',
                user: identity._id,
                name: identity._id,
                content: {},
            };
            $scope.origDictionary = {};
        });
    };

    $scope.openDictionary = function(dictionary) {
        $scope.loading = true;
        dictionaries.open(dictionary, (result) => {
            $scope.origDictionary = result;
            $scope.dictionary = Object.create(result);
            $scope.dictionary.content = Object.create(result.content || {});
            $scope.dictionary.is_active = result.is_active !== 'false';

            if ($scope.isAbbreviations(result)) {
                $scope.dictionary.content = result.content || {};
            }
        });
    };

    $scope.searchDictionary = function(param) {
        let string = param.user ? 'Personal' : param.name;

        return !$scope.query || string.toLowerCase().indexOf($scope.query.toLowerCase()) !== -1;
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
                dictionaries.remove(dictionary, () => {
                    _.remove($scope.dictionaries, dictionary);
                    notify.success(gettext('Dictionary deleted.'), 3000);
                });
            }
        );
    };

    $scope.fetchDictionaries();
}
