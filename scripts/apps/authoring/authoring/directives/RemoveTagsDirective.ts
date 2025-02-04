import * as helpers from 'apps/authoring/authoring/helpers';

RemoveTagsDirective.$inject = [];
export function RemoveTagsDirective() {
    return {
        require: 'ngModel',
        scope: {
            model: '=ngModel',
        },
        link: function(scope, elem, attr, ngModel) {
            scope.$watch('model', () => {
                if (scope.model) {
                    scope.model = helpers.stripHtmlRaw(scope.model);
                }
            });
        },
    };
}
