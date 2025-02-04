PackageItemLabelsDropdown.$inject = ['vocabularies', 'packages'];
export function PackageItemLabelsDropdown(vocabularies, packages) {
    return {
        templateUrl: 'scripts/apps/archive/views/package_item_labels_dropdown_directive.html',
        link: function(scope) {
            scope.labels = [];

            vocabularies.getVocabulary('package-story-labels').then((vocabulary) => {
                scope.labels = vocabulary.items;
            });

            scope.setItemLabel = (label) => {
                packages.setItemLabel(scope.item, label);
            };

            scope.isSetItemLabel = (label) => packages.isSetItemLabel(scope.item, label);
        },
    };
}
