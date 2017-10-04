import * as helpers from 'apps/authoring/authoring/helpers';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdReadingTime
 * @description Display the estimated number of minutes needed to read an item.
 *
 * @param {String} item text to estimate
 */
export function ReadingTime() {
    return {
        scope: {
            item: '=',
            html: '@'
        },
        template: '<span ng-if="readingTime==0" class="char-count reading-time" translate>' +
            'less than one minute read</span>' +
            '<span ng-if="readingTime>0" class="char-count reading-time" translate>' +
            '{{readingTime}} min read</span>',
        link: function ReadingTimeLink(scope, elem, attrs) {
            scope.html = scope.html || false;
            scope.$watch('item', () => {
                let {html, item} = scope;
                let input = html ? helpers.cleanHtml(item || '') : item || '';
                let numWords = _.compact(input.split(/\s+/)).length || 0;
                let readingTimeFloat = numWords / 250;
                let readingTimeMinutes = Math.floor(readingTimeFloat);
                let readingRemainingSec = Math.floor((readingTimeFloat - readingTimeMinutes) * 60);

                if (readingRemainingSec >= 30) {
                    readingTimeMinutes++;
                }

                scope.readingTime = readingTimeMinutes;
            });
        }
    };
}
