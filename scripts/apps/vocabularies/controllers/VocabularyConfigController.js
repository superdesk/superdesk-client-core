
const DEFAULT_SCHEMA = {
    name: {},
    qcode: {},
    parent: {}
};

VocabularyConfigController.$inject = ['$scope', '$route', '$routeParams', 'vocabularies', '$timeout'];
export function VocabularyConfigController($scope, $route, $routeParams, vocabularies, $timeout) {
    $scope.loading = true;

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
        $route.updateParams({id: null, new: null});
    };

    /**
     * Open modal with new item
     */
    $scope.createVocabulary = () => {
        $route.updateParams({id: null, new: true});
    };

    /**
     * Reload list of vocabularies
     */
    $scope.reloadList = () => {
        $scope.loading = true;
        vocabularies.getVocabularies().then((vocabularies) => {
            $scope.vocabularies = vocabularies._items;
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
                items: [],
                type: 'manageable',
                schema: angular.extend({}, DEFAULT_SCHEMA),
                service: {all: 1} // needed for vocabulary to be visible in content profile
            };
        }
    }
}
