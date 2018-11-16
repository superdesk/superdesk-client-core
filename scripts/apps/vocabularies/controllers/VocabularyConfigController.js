import {MEDIA_TYPES, MEDIA_TYPE_KEYS, DEFAULT_SCHEMA} from '../constants';

VocabularyConfigController.$inject = ['$scope', '$route', '$routeParams', 'vocabularies', '$rootScope',
    'api', 'notify', 'modal'];
export function VocabularyConfigController($scope, $route, $routeParams, vocabularies, $rootScope,
    api, notify, modal) {
    $scope.loading = true;
    $scope.mediaTypes = MEDIA_TYPES;

    /**
     * Open vocabulary in the edit modal.
     *
     * @param {Object} vocabulary
     */
    $scope.openVocabulary = (vocabulary) => {
        $route.updateParams({id: vocabulary._id});
    };

    /**
     * Close vocabulary edit modal
     */
    $scope.closeVocabulary = () => {
        $route.updateParams({id: null, new: null, type: null});
    };

    /**
     * Open modal with new item
     */
    $scope.createVocabulary = () => {
        $route.updateParams({id: null, new: true, type: null});
    };

    /**
     * Create new custom field
     * @param {string} type (text, picture, video or embed)
     */
    $scope.createCustomField = (type) => {
        $route.updateParams({id: null, new: true, type: type});
    };

    /**
     * Match field type to vocabularies tab
     */
    $scope.matchFieldTypeToTab = (tab, fieldType) =>
        tab === 'vocabularies' && !fieldType || fieldType &&
        (tab === 'text-fields' && fieldType === 'text' ||
            tab === 'date-fields' && fieldType === 'date' ||
            tab === 'related-content-fields' && MEDIA_TYPE_KEYS.includes(fieldType) ||
            tab === 'embed-fields' && fieldType === 'embed');

    /**
     * Reload list of vocabularies
     */
    $scope.reloadList = () => {
        $scope.loading = true;
        vocabularies.getVocabularies().then((vocabularies) => {
            $scope.vocabularies = vocabularies;
            $scope.loading = false;
            setupActiveVocabulary();
        });
    };

    /**
     * Update vocabulary in the list with given updates
     *
     * @param {Object} updates
     */
    $scope.updateVocabulary = (updates) => {
        const index = $scope.vocabularies.findIndex((v) => v._id === updates._id);

        if (index === -1) {
            $scope.vocabularies = [updates].concat($scope.vocabularies);
        } else {
            $scope.vocabularies[index] = angular.extend({}, $scope.vocabularies[index], updates);
        }

        $rootScope.$broadcast('vocabularies:updated', updates);
    };

    // remove is the UI callback for deleting a vocabulary entry
    $scope.remove = (vocabulary) => {
        modal.confirm(gettext('Please confirm you want to delete the vocabulary.'))
            .then(() => api.remove(vocabulary, {}, 'vocabularies'))
            .then(vocabularyRemoved(vocabulary), errorRemovingVocabulary);
    };

    // vocabularyRemoved updates the UI after the given vocabulary has been removed via the API.
    const vocabularyRemoved = (vocabulary) => () => {
        _.remove($scope.vocabularies, (v) => v._id === vocabulary._id);
        $scope.reloadList();
        notify.success(gettext('Vocabulary was deleted.'));
    };

    // errorRemoving alerts the user of an error that occurred while attempting to remove a vocabulary.
    const errorRemovingVocabulary = (response) => {
        const issues = response.data._issues;

        if (!issues) {
            notify.error(gettext('Error removing the vocabulary.'));
        } else if (issues._message) {
            notify.error(issues._message);
        } else if (issues.content_types) {
            const contentTypes = _.reduce(issues.content_types,
                (result, value) => result ? `${result}, ${value.label}` : value.label, null);

            notify.error(gettext('The vocabulary is used in the following content types:') + ' ' + contentTypes);
        }
    };

    $scope.$on('$routeUpdate', setupActiveVocabulary);
    $scope.reloadList();

    function setupActiveVocabulary() {
        $scope.vocabulary = null;

        if ($routeParams.id) {
            $scope.vocabulary = $scope.vocabularies.find((v) => v._id === $routeParams.id);
        }

        if ($routeParams.new) {
            $scope.vocabulary = {
                field_type: $routeParams.type || null,
                items: [],
                type: 'manageable',
                schema: angular.extend({}, DEFAULT_SCHEMA),
                service: {all: 1}, // needed for vocabulary to be visible in content profile
            };
        }

        if ($scope.vocabulary && $scope.vocabulary.field_type === 'date') {
            if (!$scope.vocabulary.date_shortcuts) {
                $scope.vocabulary.date_shortcuts = vocabularies.getDefaultDatefieldShortcuts();
            }
        }
    }
}
