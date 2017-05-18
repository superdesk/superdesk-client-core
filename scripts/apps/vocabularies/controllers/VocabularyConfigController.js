VocabularyConfigController.$inject = ['$scope', 'vocabularies', '$timeout'];
export function VocabularyConfigController($scope, vocabularies, $timeout) {
    /**
     * Opens vocabulary in the edit modal.
     *
     * @param {Object} vocabulary
     */
    $scope.openVocabulary = function(vocabulary) {
        $scope.loading = true;
        $timeout(() => {
            $scope.$apply(() => {
                $scope.vocabulary = vocabulary;
            });
        }, 200, false);
    };

    $scope.$on('vocabularies:loaded', () => {
        $scope.loading = false;
    });

    // load the list of vocabularies into component:
    vocabularies.getVocabularies().then((vocabularies) => {
        $scope.vocabularies = vocabularies;
    });
}
