import * as helpers from 'superdesk-authoring/authoring/helpers';

WordCount.$inject = ['gettextCatalog'];
export function WordCount(gettextCatalog) {
    return {
        scope: {
            item: '=',
            html: '@'
        },
        template: '<span class="char-count">{{numWords}} <span translate>' + gettextCatalog.getString('words') + '</span></span>',
        link: function wordCountLink(scope, elem, attrs) {
            scope.html = scope.html || false;
            scope.numWords = 0;
            scope.$watch('item', function() {
                var input = scope.item || '';
                input = scope.html ? helpers.cleanHtml(input) : input;
                scope.numWords = _.compact(input.split(/\s+/)).length || 0;
            });
        }
    };
}
