import {compact, trim, filter} from 'lodash';
import {cleanHtml} from '../helpers';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdReadingTime
 * @description Display the estimated number of minutes needed to read an item.
 * @param {String} item text to estimate
 */
export function ReadingTime(deployConfig) {
    return {
        scope: {
            item: '=',
            html: '@',
            language: '=',
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
        },
    };

    function getReadingTime(input, language) {
        if (language && language.startsWith('ja')) {
            return filter(input, (x) => !!trim(x)).length / deployConfig.getSync('japanese_characters_per_minute', 600);
        }

        const numWords = compact(input.split(/\s+/)).length || 0;

        return numWords / 250;
    }
}

ReadingTime.$inject = ['deployConfig'];
