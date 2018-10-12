import * as helpers from 'apps/authoring/authoring/helpers';

CharacterCount.$inject = [];
export function CharacterCount() {
    return {
        scope: {
            item: '=',
            limit: '=',
            html: '@',
        },
        template: '<span class="char-count" ng-class="{error: limit && numChars > limit}"> ' +
                gettext(' characters') + '</span>' +
                '<span class="char-count" ng-class="{error: limit && numChars > limit}">{{numChars}}' +
                '<span ng-if="limit" ng-class="{error: limit && numChars > limit}">/{{ limit }}</span></span>',
        link: function characterCountLink(scope, elem, attrs) {
            scope.html = scope.html || false;
            scope.numChars = 0;
            scope.$watch('item', () => {
                var input = scope.item || '';

                input = scope.html ? helpers.cleanHtml(input) : input;
                input = input.replace(/\r?\n|\r/g, '');

                scope.numChars = input.length || 0;
            });
        },
    };
}
