/**
 * This file is part of Superdesk.
 *
 * Copyright 2013-2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

VocabularyService.$inject = ['api', '$q', '$filter'];
function VocabularyService(api, $q, $filter) {
    var service = this;

    /**
     * Fetches and caches vocabularies or returns them from the cache.
     *
     * @returns {Promise}
     */
    this.getVocabularies = function() {
        if (typeof service.vocabularies === 'undefined') {
            return api.query('vocabularies', {where: {type: 'manageable'}}).then(
                function(result) {
                    result._items = $filter('sortByName')(result._items, 'display_name');
                    service.vocabularies = result;
                    return service.vocabularies;
                }
            );
        } else {
            return $q.when(service.vocabularies);
        }
    };
}

VocabularyConfigController.$inject = ['$scope', 'vocabularies', '$timeout'];
function VocabularyConfigController($scope, vocabularies, $timeout) {

    /**
     * Opens vocabulary in the edit modal.
     *
     * @param {Object} vocabulary
     */
    $scope.openVocabulary = function(vocabulary) {
        $scope.loading = true;
        $timeout(function() {  $scope.vocabulary = vocabulary;
        }, 200, true);
    };

    $scope.$on('vocabularies:loaded', function() {
        $scope.loading = false;
    });

    // load the list of vocabularies into component:
    vocabularies.getVocabularies().then(function(vocabularies) {
        $scope.vocabularies = vocabularies;
    });
}

VocabularyEditController.$inject = [
  '$scope',
  'gettext',
  'notify',
  'api',
  'vocabularies',
  'metadata',
  'cvSchema',
  '$rootScope'
];
function VocabularyEditController($scope, gettext, notify, api, vocabularies, metadata, cvSchema, $rootScope) {

    var origVocabularyItems = _.cloneDeep($scope.vocabulary.items);

    /**
     * Unload vocabulary/close modal.
     */
    function closeVocabulary() {
        $rootScope.$broadcast('vocabularies:loaded');
        $scope.vocabulary = null;
    }

    function onSuccess(result) {
        notify.success(gettext('Vocabulary saved successfully'));
        closeVocabulary();
        return result;
    }

    function onError(response) {
        if (angular.isDefined(response.data._issues)) {
            if (angular.isDefined(response.data._issues['validator exception'])) {
                notify.error(gettext('Error: ' +
                                     response.data._issues['validator exception']));
            } else {
                notify.error(gettext('Error. Vocabulary not saved.'));
            }
        }
    }

    /**
     * Save current edit modal contents on backend.
     */
    $scope.save = function() {
        $scope._errorUniqueness = false;
        $scope.errorMessage = null;

        if ($scope.vocabulary._id === 'crop_sizes') {
            var activeItems = _.filter($scope.vocabulary.items, function(o) { return o.is_active; });
            _.each(_.union(_.map(activeItems, 'width'), _.map(activeItems, 'height')), function (item) {
                if (parseInt(item) < 200) {
                    $scope.errorMessage = gettext('Minimum height and width should be greater than or equal to 200');
                }
            });
        }

        if ($scope.errorMessage == null) {
            api.save('vocabularies', $scope.vocabulary).then(onSuccess, onError);
        }
        // discard metadata cache:
        metadata.loaded = null;
        metadata.initialize();
    };

    /**
     * Discard changes and close modal.
     */
    $scope.cancel = function() {
        $scope.vocabulary.items = origVocabularyItems;
        closeVocabulary();
    };

    /**
     * Add new blank vocabulary item.
     */
    $scope.addItem = function() {
        var newVocabulary = {};
        _.extend(newVocabulary, $scope.model);
        newVocabulary.is_active = true;

        $scope.vocabulary.items.unshift(newVocabulary);
    };

    // try to reproduce data model of vocabulary:
    var model = _.mapValues(_.keyBy(
        _.uniq(_.flatten(
            _.map($scope.vocabulary.items, function(o) { return _.keys(o); })
        ))
    ), function() { return null; });

    $scope.model = model;
    $scope.schema = $scope.vocabulary.schema || cvSchema[$scope.vocabulary._id] || null;
}

var app = angular.module('superdesk.vocabularies',
                         [ 'superdesk.activity', 'superdesk.authoring.metadata']);
app.config([
  'superdeskProvider',
  function(superdesk) {
      superdesk.activity('/settings/vocabularies', {
          label: gettext('Vocabularies'),
          templateUrl: 'scripts/superdesk-vocabularies/views/settings.html',
          category: superdesk.MENU_SETTINGS,
          priority: -800,
          privileges: {vocabularies: 1}
      });
  }
])
.service('vocabularies', VocabularyService)
.controller('VocabularyEdit', VocabularyEditController)
.controller('VocabularyConfig', VocabularyConfigController)
.directive('sdVocabularyConfig', function() {
    return {
        scope: {
            vocabulary: '=',
        },
        controller: 'VocabularyConfig',
        templateUrl: 'scripts/superdesk-vocabularies/views/vocabulary-config.html'
    };
})
.directive('sdVocabularyConfigModal', function() {
    return {
        scope: {
            vocabulary: '=',
        },
        controller: 'VocabularyEdit',
        templateUrl: 'scripts/superdesk-vocabularies/views/vocabulary-config-modal.html'
    };
})
.factory('cvSchema', ['gettext', function(gettext) {
    var colorScheme = {
        name: {type: 'text', label: gettext('Name')},
        qcode: {type: 'text', label: gettext('QCode')},
        color: {type: 'color', label: gettext('Color')},
        short: {type: 'text', label: gettext('List Name')}
    };

    return {
        urgency: colorScheme,
        priority: colorScheme
    };
}]);
