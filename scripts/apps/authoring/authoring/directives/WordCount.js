import * as helpers from 'apps/authoring/authoring/helpers';
import {convertFromRaw} from 'draft-js';

WordCount.$inject = ['gettextCatalog'];
export function WordCount(gettextCatalog) {
    return {
        scope: {
            item: '=',
            html: '@',
            editorState: '@'
        },
        template: '<span class="char-count words">{{numWords}} <span translate>'
            + gettextCatalog.getString('words') + '</span></span>',
        link: function wordCountLink(scope, elem, attrs) {
            scope.html = scope.html || false;
            scope.numWords = 0;
            scope.$watch('item', () => {
                var input = scope.item || '';

                input = scope.html ? helpers.cleanHtml(input) : input;
                input = scope.editorState ? convertFromRaw(input).getPlainText() : input;

                scope.numWords = _.compact(input.split(/\s+/)).length || 0;
            });
        }
    };
}
