import {compact, trim, filter} from 'lodash';
import {cleanHtml} from '../helpers';

function getReadingTime(input, language) {
    if (language && language.startsWith('ja')) {
        return filter(input, (x) => trim(x)).length / 240; // 4 characters per minute
    }

    const numWords = compact(input.split(/\s+/)).length || 0;

    return numWords / 250;
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdReadingTime
 * @description Display the estimated number of minutes needed to read an item.
 * @param {String} item text to estimate
 */
export function ReadingTime() {
    return {
        scope: {
            item: '=',
            html: '@',
            language: '='
        },
        template: '<span ng-if="readingTime==0" class="char-count reading-time" translate>' +
            'less than one minute read</span>' +
            '<span ng-if="readingTime>0" class="char-count reading-time" translate>' +
            '{{readingTime}} min read</span>',
        link: function ReadingTimeLink(scope, elem, attrs) {
            scope.$watchGroup(['item', 'language'], () => {
                let {html, item, language} = scope;
                let input = html ? cleanHtml(item || '') : item || '';
                let readingTimeFloat = getReadingTime(input, language);
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
