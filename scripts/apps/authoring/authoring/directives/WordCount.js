import * as helpers from 'apps/authoring/authoring/helpers';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdWordCount
 * @description Display the number of words in an item.
 *
 * @param {String} item text to use
 */
export function WordCount() {
    return {
        scope: {
            item: '=',
            html: '@'
        },
        template: '<span class="char-count words" translate>{{numWords}} words</span>',
        link: function wordCountLink(scope, elem, attrs) {
            scope.html = scope.html || false;
            scope.numWords = 0;
            scope.$watch('item', () => {
                var input = scope.item || '';

                input = scope.html ? helpers.cleanHtml(input) : input;
                scope.numWords = _.compact(input.split(/\s+/)).length || 0;
            });
        }
    };
}
