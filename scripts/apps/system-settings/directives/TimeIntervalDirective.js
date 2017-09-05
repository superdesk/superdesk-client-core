export function TimeIntervalDirective() {
    return {
        scope: {
            interval: '='
        },
        templateUrl: 'scripts/apps/system-settings/views/time-interval.html',
        link: (scope, elem, attrs, ngModel) => {
            scope.hours = Array.from(Array(24), (_, x) => x);
            scope.minutes = Array.from(Array(60), (_, x) => x);

            function init() {
                scope.time_interval = {days: 0, hours: 0, minutes: 0, seconds: 0};
                if (scope.interval) {
                    var daysRegex = /\d+d/,
                        hoursRegex = /\d{1,2}h/,
                        minutesRegex = /\d{1,2}m/,
                        secondsRegex = /\d{1,2}s/;

                    var days = daysRegex.exec(scope.interval),
                        hours = hoursRegex.exec(scope.interval),
                        minutes = minutesRegex.exec(scope.interval),
                        seconds = secondsRegex.exec(scope.interval);

                    scope.time_interval.days = days ? parseInt(days[0], 10) : 0;
                    scope.time_interval.hours = hours ? parseInt(hours[0], 10) : 0;
                    scope.time_interval.minutes = minutes ? parseInt(minutes[0], 10) : 0;
                    scope.time_interval.seconds = seconds ? parseInt(seconds[0], 10) : 0;
                }
            }

            function intervalToString(newInterval) {
                scope.interval = '';
                if (scope.time_interval.days > 0) {
                    scope.interval = scope.time_interval.days + 'd ';
                }
                if (scope.time_interval.hours > 0) {
                    scope.interval += scope.time_interval.hours + 'h ';
                }
                if (scope.time_interval.minutes > 0) {
                    scope.interval += scope.time_interval.minutes + 'm ';
                }
                if (scope.time_interval.seconds > 0) {
                    scope.interval += scope.time_interval.seconds + 's';
                }
            }

            scope.$watch('interval', () => {
                init();
            });

            scope.$watchCollection('time_interval', (newInterval) => {
                intervalToString(newInterval);
            });
        }
    };
}
