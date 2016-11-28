VocabularyConfigController.$inject = ['$scope', 'vocabularies', '$timeout'];
export function VocabularyConfigController($scope, vocabularies, $timeout) {
    /**
     * Opens vocabulary in the edit modal.
     *
     * @param {Object} vocabulary
     */
    $scope.openVocabulary = function(vocabulary) {
        $scope.loading = true;
        $timeout(function() {
            $scope.vocabulary = vocabulary;
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
