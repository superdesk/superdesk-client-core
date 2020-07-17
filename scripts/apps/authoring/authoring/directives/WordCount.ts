import * as helpers from 'apps/authoring/authoring/helpers';
import {countWords} from 'core/count-words';

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
        template: require('./WordCount.html'),
        link: function wordCountLink(scope, elem, attrs) {
            scope.html = scope.html || false;
            scope.countOnly = scope.countOnly || false;
            scope.numWords = 0;
            scope.$watch('item', () => {
                var input = scope.item || '';

                input = scope.html ? helpers.cleanHtml(input) : input;
                scope.numWords = countWords(input);
            });
        },
    };
}
