
PreferedCvItemsConfigDirective.$inject = ['metadata'];
export default function PreferedCvItemsConfigDirective(metadata) {
    return {
        template: require('./views/prefered-cv-items-config.html'),
        scope: true,
        require: 'ngModel',
        link: (scope, elem, attrs, ngModel) => {
            ngModel.$render = () => {
                scope.updates = ngModel.$viewValue || {};
            };

            scope.updateModel = () => {
                ngModel.$setViewValue(Object.assign({}, scope.updates), 'change');
                ngModel.$setDirty();
            };

            metadata.initialize().then(() => {
                scope.cvs = metadata.cvs.filter((cv) => cv.preffered_items);
            });
        },
    };
}