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
            html: '@',
            countOnly: '@',
        },
        template: '<span ng-if="!countOnly" class="char-count words" translate>{{numWords}} words</span>' +
                  '<span ng-if="countOnly" class="char-count words">{{numWords}}</span>',
        link: function wordCountLink(scope, elem, attrs) {
            /* This pattern matches http(s) links, numbers (1.000.000 or 1,000,000 or 1 000 000), regulars words,
            compound words (e.g. "two-done") or abbreviation (e.g. D.C.)
            If you modify, please keep in sync with superdesk-core/superdesk/text_utils.py
            */
            const WORD_PATTERN = /https?:[^ ]*|([0-9]+[,. ]?)+|([\w]\.)+|[\w][\w-]*/g;

            scope.html = scope.html || false;
            scope.countOnly = scope.countOnly || false;
            scope.numWords = 0;
            scope.$watch('item', () => {
                var input = scope.item || '';

                input = scope.html ? helpers.cleanHtml(input) : input;
                scope.numWords = (input.match(WORD_PATTERN) || '').length;
            });
        },
    };
}
