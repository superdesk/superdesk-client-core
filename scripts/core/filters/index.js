import {stripHtmlTags} from '../utils';

export default angular.module('superdesk.core.filters', [])
    .filter('any', () => function(data, key) {
        return _.any(data, key);
    })
    .filter('body', () => function(content) {
        var lines = $(content);
        var texts = [];

        for (var i = 0; i < lines.length; i++) {
            var el = $(lines[i]);

            if (el.is('p')) {
                texts.push(el[0].outerHTML);
            }
        }

        return texts.join('\n');
    })
    .filter('mergeWords', ['lodash', function(_) {
        return function(array, propertyName, schemeName, returnArray) {
            var subjectMerged = [];

            _.forEach(array, (item) => {
                var value = _.isNil(propertyName) ? item : item[propertyName];

                if (value) {
                    subjectMerged.push(value);

                    if (schemeName && item.scheme !== schemeName) {
                        subjectMerged.pop();
                    }
                }
            });

            if (returnArray) {
                return subjectMerged;
            }

            return subjectMerged.join(', ');
        };
    }])
    .filter('splitWords', () => function(word) {
        var split = [];

        _.forEach(word.split(','), (w) => {
            var trim = w.replace(/^\s+|\s+$/g, '');

            split.push({name: trim});
        });
        return split;
    })
    .filter('trusted', ['$sce', function($sce) {
        return function(value) {
            return $sce.trustAsResourceUrl(value);
        };
    }])
    .filter('filterObject', ['$filter', function($filter) {
        return function(items, fields) {
            var filtered = [];

            angular.forEach(items, (item) => {
                filtered.push(item);
            });
            return $filter('filter')(filtered, fields);
        };
    }])
    .filter('menuGroup', () => function(input) {
        if (!input || !input.category) {
            return '#/';
        }
        return '#' + input.href;
    })
    .filter('truncateString', () => function(inputString, limit, postfix) {
        return _.truncate(inputString, {length: limit, omission: postfix || '...'});
    })
    .filter('formatDateTimeString', ['moment', function(moment) {
        return function(input, formatString) {
            var momentTimestamp = angular.isDefined(input) ? moment(input).utc() : moment.utc();

            return angular.isDefined(formatString) ? momentTimestamp.format(formatString)
                : momentTimestamp.format();
        };
    }])
    .filter('formatLocalDateTimeString', ['moment', function(moment) {
        return function(input, formatString) {
            var momentTimestamp = angular.isDefined(input) ? moment(input).utc() : moment.utc();

            return angular.isDefined(formatString) ? momentTimestamp.local().format(formatString) :
                momentTimestamp.local().format();
        };
    }])
    .filter('dateTimeString', ['$filter', function($filter) {
        return function(input) {
            if (input !== null) {
                return $filter('date')(input, 'dd.MM.yyyy HH:mm');
            }
        };
    }])
    .filter('dateTimeStringWithSecs', ['$filter', function($filter) {
        return function(input) {
            if (input !== null) {
                return $filter('date')(input, 'dd.MM.yyyy HH:mm:ss');
            }
        };
    }])
    .filter('queueStatus', () =>
        function(input) {
            if (input === 'pending') {
                return 'warning';
            } else if (input === 'success') {
                return 'success';
            } else if (input === 'error') {
                return 'danger';
            }
        }
    )
    .filter('mergeTargets', () => function(array) {
        var merged = [];

        _.forEach(array, (item) => {
            if ('allow' in item) {
                merged.push(item.allow === false ? 'Not ' + item.name : item.name);
            } else {
                merged.push(item.name);
            }
        });

        return merged.join(', ');
    })
    .filter('previewDateline', ['$filter', 'moment', function($filter, moment) {
        return function(located, source, datelineDate) {
            if (_.isObject(located) && angular.isDefined(located.city)) {
                var momentizedTimestamp = angular.isDefined(datelineDate) ? moment.utc(datelineDate) : moment.utc();
                var _month = '';

                if (angular.isDefined(located) && located.tz !== 'UTC') {
                    momentizedTimestamp = momentizedTimestamp.tz(located.tz);
                }

                var currentMonth = momentizedTimestamp.month() + 1;

                if (currentMonth === 9) {
                    _month = 'Sept ';
                } else if (currentMonth >= 3 && currentMonth <= 7) {
                    _month = momentizedTimestamp.format('MMMM');
                } else {
                    _month = momentizedTimestamp.format('MMM');
                }

                return $filter('formatDatelineText')(located, _month, momentizedTimestamp.format('D'), source);
            }

            return '';
        };
    }])
    .filter('daysInAMonth', ['moment', (moment) => function(month) {
        let _timeStamp = Number.isInteger(month) ? moment(month + 1, 'MM') : moment();

        return Array.from({length: _timeStamp.daysInMonth()}, (value, index) => (index + 1).toString());
    }])
    .filter('parseDateline', ['moment', (moment) => function(dateToFormat, located) {
        var momentizedTimestamp = dateToFormat ? moment.utc(dateToFormat) : moment.utc();

        if (angular.isDefined(located) && located.tz !== 'UTC') {
            momentizedTimestamp = momentizedTimestamp.tz(located.tz);
        }

        return {month: momentizedTimestamp.month().toString(), day: momentizedTimestamp.format('D')};
    }])
    .filter('formatDatelineText', () => function(located, month, date, source = '') {
        var dateline = located.city_code;
        var datelineFields = located.dateline.split(',');

        if (_.indexOf(datelineFields, 'state')) {
            dateline.concat(', ', located.state_code);
        }

        if (_.indexOf(datelineFields, 'country')) {
            dateline.concat(', ', located.country_code);
        }

        return dateline.toUpperCase().concat(', ', month, ' ', date, ' ', source, ' -');
    })
    .filter('relativeUTCTimestamp', ['moment', (moment) => function(located, month, date) {
        var currentTSInLocated = located.tz === 'UTC' ? moment.utc() : moment().tz(located.tz);

        currentTSInLocated.month(month).date(date);

        return currentTSInLocated.toISOString();
    }])
    .filter('sortByName', () => function(_collection, propertyName = 'name') {
        return _.sortBy(_collection, (_entry) => _entry[propertyName] ?
            _entry[propertyName].toLowerCase()
            : _entry.name.toLowerCase());
    })
    .filter('formatFilterCondition', () => function(filterCondition, valueLookup) {
        var labels = [];

        if (filterCondition.field === 'anpa_category' || filterCondition.field === 'subject') {
            var values = filterCondition.value.split(',');

            _.each(values, (value) => {
                var v = _.find(valueLookup, (val) => val.qcode.toString() === value);

                labels.push(v.name);
            });
        }

        var conditionValue = labels.length > 0 ? labels.join(', ') : filterCondition.value;

        return '(' + filterCondition.field + ' ' + filterCondition.operator + ' ' + conditionValue + ')';
    })
    .filter('removeLodash', () => function(value) {
        var cleanedValue = value || '';

        return cleanedValue.replace('_', ' ');
    })
    .filter('stripHtmlTags', () => function(value) {
        return stripHtmlTags(value);
    })
    .filter('join', () => function(value, separator = ', ') {
        return value.filter(angular.identity).join(separator);
    })
;
