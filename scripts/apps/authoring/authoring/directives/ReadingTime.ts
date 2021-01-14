import {compact, trim, filter} from 'lodash';
import {cleanHtml} from '../helpers';
import {appConfig} from 'appConfig';
import {gettext, gettextPlural} from 'core/utils';

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
            language: '=',
        },
        // tslint:disable-next-line: max-line-length
        template: '<span class="char-count reading-time">{{readingTime === 0 ? getReadingTimeLabelLessThanMinute() : getReadingTimeLabel(readingTime)}}</span>',
        link: function ReadingTimeLink(scope, elem, attrs) {
            const timeToRead = appConfig.authoring == null || appConfig.authoring.timeToRead == null
                ? true
                : appConfig.authoring.timeToRead;

            if (!timeToRead) {
                scope.readingTime = null;
                return;
            }

            scope.getReadingTimeLabel = (minutes) => gettext('{{x}} min read', {x: minutes});

            scope.getReadingTimeLabelLessThanMinute = () => gettext('less than one minute read');

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
            return filter(input, (x) => !!trim(x)).length / (appConfig.japanese_characters_per_minute || 600);
        }

        const numWords = compact(input.split(/\s+/)).length || 0;

        return numWords / 250;
    }
}

ReadingTime.$inject = [];
