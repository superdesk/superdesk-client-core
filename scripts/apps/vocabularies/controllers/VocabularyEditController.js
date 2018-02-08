import _ from 'lodash';

VocabularyEditController.$inject = [
    '$scope',
    'gettext',
    'notify',
    'api',
    'vocabularies',
    'metadata',
    'cvSchema'
];

export function VocabularyEditController($scope, gettext, notify, api, vocabularies, metadata, cvSchema) {
    var origVocabulary = _.cloneDeep($scope.vocabulary);

    $scope.idRegex = '^[a-zA-Z0-9-_]+$';

    function onSuccess(result) {
        notify.success(gettext('Vocabulary saved successfully'));
        $scope.closeVocabulary();
        $scope.updateVocabulary(result);
        $scope.issues = null;
        return result;
    }

    function onError(response) {
        if (angular.isDefined(response.data._issues)) {
            if (angular.isDefined(response.data._issues['validator exception'])) {
                notify.error(gettext('Error: ' +
                                     response.data._issues['validator exception']));
            } else {
                $scope.issues = response.data._issues;
                notify.error(gettext('Error. Vocabulary not saved.'));
            }
        }
    }

    function checkForUniqueValues() {
        const uniqueField = $scope.vocabulary.unique_field || 'qcode';
        const list = $scope.vocabulary.items || {};
        const uniqueList = _.uniqBy(list, (item) => item[uniqueField]);

        return list.length === uniqueList.length;
    }

    /**
     * Save current edit modal contents on backend.
     */
    $scope.save = function() {
        $scope._errorUniqueness = false;
        $scope.errorMessage = null;
        delete $scope.vocabulary._deleted;

        if ($scope.vocabulary._id === 'crop_sizes') {
            var activeItems = _.filter($scope.vocabulary.items, (o) => o.is_active);

            _.each(_.union(_.map(activeItems, 'width'), _.map(activeItems, 'height')), (item) => {
                if (parseInt(item, 10) < 200) {
                    $scope.errorMessage = gettext('Minimum height and width should be greater than or equal to 200');
                }
            });
        }

        if (!checkForUniqueValues()) {
            const uniqueField = $scope.vocabulary.unique_field || 'qcode';

            $scope.errorMessage = gettext('The values should be unique for ') + uniqueField;
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
        angular.copy(origVocabulary, $scope.vocabulary);
        $scope.closeVocabulary();
    };

    /**
     * Add new blank vocabulary item.
     */
    $scope.addItem = function() {
        var newVocabulary = {};

        _.extend(newVocabulary, $scope.model);
        newVocabulary.is_active = true;

        $scope.vocabulary.items = $scope.vocabulary.items.concat([newVocabulary]);
    };

    // try to reproduce data model of vocabulary:
    var model = _.mapValues(_.keyBy(
        _.uniq(_.flatten(
            _.map($scope.vocabulary.items, (o) => _.keys(o))
        ))
    ), () => null);

    $scope.model = model;
    $scope.schema = $scope.vocabulary.schema || cvSchema[$scope.vocabulary._id] || null;
    if ($scope.schema) {
        $scope.schemaFields = Object.keys($scope.schema)
            .sort()
            .map((key) => angular.extend(
                {key: key},
                $scope.schema[key]
            ));
    }

    /**
     * Remove item from vocabulary items
     *
     * @param {number} index
     */
    $scope.removeItem = (index) => {
        $scope.vocabulary.items.splice(index, 1);
        $scope.vocabulary.items = $scope.vocabulary.items.slice(); // trigger watch on items collection
    };
}
