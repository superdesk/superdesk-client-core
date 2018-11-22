import {MEDIA_TYPES, MEDIA_TYPE_KEYS, DEFAULT_SCHEMA, VOCABULARY_SELECTION_TYPES} from '../constants';

const OTHER = 'Other';

VocabularyConfigController.$inject = ['$scope', '$route', '$routeParams', 'vocabularies', '$rootScope',
    'api', 'notify', 'modal', 'session'];
export function VocabularyConfigController($scope, $route, $routeParams, vocabularies, $rootScope,
    api, notify, modal, session) {
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
            const wordSet = (vocabularies || []).reduce((wordSet, vocabulary) => {
                (vocabulary.tags || []).forEach((tag) => {
                    wordSet.add(tag.text);
                });
                return wordSet;
            }, new Set());

            let wordList = Array.from(wordSet).sort((a, b) => a.localeCompare(b));

            wordList.push(OTHER);

            $scope.tags = wordList.map((word) => ({text: word}));
            $scope.vocabularies = vocabularies;
            $scope.loading = false;
            setupActiveVocabulary();
        });
    };

    function checkTag(vocabulary, currentTag, tab) {
        return $scope.matchFieldTypeToTab(tab, vocabulary.field_type) &&
        (currentTag.text === OTHER && (vocabulary.tags == null || vocabulary.tags.length === 0) ||
        (vocabulary.tags || []).some((tag) => tag.text === currentTag.text));
    }

    $scope.getVocabulariesForTag = (currentTag, tab) =>
        ($scope.vocabularies || []).filter((vocabulary) => checkTag(vocabulary, currentTag, tab));

    $scope.existsVocabulariesForTag = (currentTag, tab) =>
        ($scope.vocabularies || []).some((vocabulary) => checkTag(vocabulary, currentTag, tab));

    /**
     * Update vocabulary in the list with given updates
     *
     * @param {Object} updates
     */
    $scope.updateVocabulary = (updates) => {
        const index = $scope.vocabularies.findIndex((v) => v._id === updates._id);
        var vocabulary = null;

        if (index === -1) {
            $scope.vocabularies = [updates].concat($scope.vocabularies);
            vocabulary = $scope.vocabularies;
        } else {
            $scope.vocabularies[index] = angular.extend({}, $scope.vocabularies[index], updates);
            vocabulary = $scope.vocabularies[index];
        }

        const dataVocabulary = {
            user: session.identity._id,
            vocabulary: vocabulary.display_name || vocabulary._id,
            vocabulary_id: vocabulary._id,
        };

        $rootScope.$broadcast('vocabularies:updated', dataVocabulary);
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

            if ($routeParams.type == null) {
                $scope.vocabulary.selection_type = VOCABULARY_SELECTION_TYPES.MULTIPLE_SELECTION.id;
            }
        }

        if ($scope.vocabulary && $scope.vocabulary.field_type === 'date') {
            if (!$scope.vocabulary.date_shortcuts) {
                $scope.vocabulary.date_shortcuts = vocabularies.getDefaultDatefieldShortcuts();
            }
        }
    }
}
