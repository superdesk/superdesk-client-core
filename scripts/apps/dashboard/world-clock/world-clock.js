import './world-clock.scss';
import d3 from 'd3';

angular.module('superdesk.apps.dashboard.world-clock', [
    'superdesk.apps.dashboard', 'superdesk.core.datetime'
])
    .directive('sdWorldclock', [function() {
        return {
            templateUrl: 'scripts/apps/dashboard/world-clock/worldClock.html',
            replace: true,
            restrict: 'A',
            controller: 'WorldClockController'
        };
    }])

    /**
     * @ngdoc controller
     * @module superdesk.apps.dashboard
     * @name WorldClockConfigController
     * @description
     *   Controller for the world clock widget configuration modal.
     */
    .controller('WorldClockConfigController', ['$scope', 'notify', 'tzdata',
        function($scope, notify, tzdata) {
            $scope.availableZones = [];

            tzdata.$promise.then(() => {
                $scope.availableZones = tzdata.getTzNames();
            });

            $scope.notify = function(action, zone) {
                if (action === 'add') {
                    notify.success(gettext('World clock added:') + ' ' + zone, 3000);
                } else if (action === 'remove') {
                    notify.success(gettext('World clock removed:') + ' ' + zone, 3000);
                }
            };

            $scope.notIn = function(haystack) {
                return function(needle) {
                    return haystack.indexOf(needle) === -1;
                };
            };

            $scope.configuration.zones = $scope.configuration.zones || [];
        }])

    /**
     * @ngdoc controller
     * @module superdesk.apps.dashboard
     * @name WorldClockController
     * @description
     *   Controller for the sdWorldclock directive - the one that creates
     *   a dashboard widget for displaying the current time in different
     *   time zones around the world.
     */
    .controller('WorldClockController', ['$scope', '$interval', 'tzdata', 'moment',
        function($scope, $interval, tzdata, moment) {
            var interval, INTERVAL_DELAY = 500;

            function updateUTC() {
                $scope.utc = moment();
                $scope.$digest();
            }

        // XXX: a hack-ish workaround to expose the object loaded via
        // RequireJS to the testing code which does not use the latter
            this._moment = moment;

            tzdata.$promise.then(() => {
                moment.tz.add(
                _.pick(tzdata, ['zones', 'links'])
            );
            });

            interval = $interval(updateUTC, INTERVAL_DELAY, 0, false);
            $scope.$on('$destroy', function stopTimeout() {
                $interval.cancel(interval);
            });
        }])
    /**
     * sdClock analog clock
     */
    .directive('sdClock', () => {
        var pi = Math.PI,
            scales = {
                s: d3.scale
                    .linear()
                    .domain([0, 59 + 999 / 1000])
                    .range([0, 2 * pi]),
                m: d3.scale
                    .linear()
                    .domain([0, 59 + 59 / 60])
                    .range([0, 2 * pi]),
                h: d3.scale
                    .linear()
                    .domain([0, 11 + 59 / 60])
                    .range([0, 2 * pi])
            };

        return {
            scope: {
                utc: '=',
                tz: '@'
            },
            link: function(scope, element, attrs) {
                var width = 105,
                    height = 100,
                    r = Math.min(width, height) * 0.8 * 0.5,
                    dayBg = '#d8d8d8',
                    dayClockhands = '#313131',
                    dayNumbers = '#a0a0a0',
                    nightBg = '#313131',
                    nightClockhands = '#e0e0e0',
                    nightNumbers = '#848484';

                var svg = d3.select(element[0])
                    .append('svg')
                        .attr('widgth', width)
                        .attr('height', height);

                var clock = svg.append('g')
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

                // background circle
                clock.append('circle')
                    .attr('r', r)
                    .attr('class', 'clock-outer')
                    .style('stroke-width', 1.5);

                // inner dot
                clock.append('circle')
                    .attr('r', 1.5)
                    .attr('class', 'clock-inner');

                // numbers
                clock.selectAll('.number-lines')
                    .data(_.range(0, 59, 5))
                    .enter()
                    .append('path')
                        .attr('d', (d) => {
                            var angle = scales.m(d);
                            var arc = d3.svg.arc()
                                .innerRadius(r * 0.7)
                                .outerRadius(r * 0.9)
                                .startAngle(angle)
                                .endAngle(angle);

                            return arc();
                        })
                    .attr('class', 'number-lines')
                    .style('stroke-width', 1.5);

                // format data for given time
                function getData(timeStr) {
                    var time = timeStr.split(':');

                    return [
                        {unit: 'h', val: parseInt(time[0], 10) + parseInt(time[1], 10) / 60, r: 0.5},
                        {unit: 'm', val: parseInt(time[1], 10), r: 0.8}
                    ];
                }

                scope.$watch('utc', (utc) => {
                    var time = utc ? utc.tz(scope.tz).format('HH:mm:ss') : '00:00:00';
                    var data = getData(time);
                    var isDay = data[0].val >= 8 && data[0].val < 20;

                    if (isDay) {
                        clock.selectAll('.clock-outer').style('fill', dayBg);
                        clock.selectAll('.clock-inner').style('fill', dayBg);
                        clock.selectAll('.number-lines').style('stroke', dayNumbers);
                    } else {
                        clock.selectAll('.clock-outer').style('fill', nightBg);
                        clock.selectAll('.clock-inner').style('fill', nightBg);
                        clock.selectAll('.number-lines').style('stroke', nightNumbers);
                    }

                    clock.selectAll('.clockhand').remove();
                    clock.selectAll('.clockhand')
                        .data(data)
                        .enter()
                        .append('path')
                        .attr('d', (d) => {
                            var angle = scales[d.unit](d.val);
                            var arc = d3.svg.arc()
                                .innerRadius(r * 0)
                                .outerRadius(r * d.r)
                                .startAngle(angle)
                                .endAngle(angle);

                            return arc();
                        })
                        .attr('class', 'clockhand')
                        .style('stroke-width', 2)
                        .style('stroke', isDay ? dayClockhands : nightClockhands);
                });
            }
        };
    })
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('world-clock', {
            label: gettext('World Clock'),
            multiple: true,
            icon: 'time',
            max_sizex: 2,
            max_sizey: 1,
            sizex: 1,
            sizey: 1,
            classes: 'tabs modal--nested-fix',
            thumbnail: 'scripts/apps/dashboard/world-clock/thumbnail.svg',
            template: 'scripts/apps/dashboard/world-clock/widget-worldclock.html',
            configurationTemplate: 'scripts/apps/dashboard/world-clock/configuration.html',
            configuration: {zones: ['Europe/London', 'Asia/Tokyo', 'Europe/Moscow']},
            description: gettext('World clock widget')
        });
    }]);
