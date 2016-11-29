import * as helpers from 'apps/authoring/authoring/helpers';

RemoveTagsDirective.$inject = [];
export function RemoveTagsDirective() {
    var htmlRegex = /(<([^>]+)>)/ig;

    return {
        require: 'ngModel',
        scope: {
            model: '=ngModel'
        },
        link: function(scope, elem, attr, ngModel) {
            scope.$watch('model', function() {
                if (scope.model) {
                    scope.model = helpers.stripHtmlRaw(scope.model).replace(htmlRegex, '');
                }
            });
        }
    };
}
