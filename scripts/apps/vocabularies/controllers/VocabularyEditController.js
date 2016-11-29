import _ from 'lodash';

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

export function VocabularyEditController($scope, gettext, notify, api, vocabularies, metadata, cvSchema, $rootScope) {
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
            var activeItems = _.filter($scope.vocabulary.items, (o) => o.is_active);

            _.each(_.union(_.map(activeItems, 'width'), _.map(activeItems, 'height')), (item) => {
                if (parseInt(item, 10) < 200) {
                    $scope.errorMessage = gettext('Minimum height and width should be greater than or equal to 200');
                }
            });
        }

        if (_.isNil($scope.errorMessage)) {
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
            _.map($scope.vocabulary.items, (o) => _.keys(o))
        ))
    ), () => null);

    $scope.model = model;
    $scope.schema = $scope.vocabulary.schema || cvSchema[$scope.vocabulary._id] || null;
}
