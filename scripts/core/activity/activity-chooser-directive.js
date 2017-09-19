angular.module('superdesk.core.activity.chooser', [])
    .directive('sdActivityChooser', ['activityChooser', 'keyboardManager', 'asset', 'lodash',
        function(activityChooser, keyboardManager, asset, _) {
            return {
                scope: {},
                templateUrl: asset.templateUrl('core/activity/views/activity-chooser.html'),
                link: function(scope, elem, attrs) {
                    var UP = -1,
                        DOWN = 1;

                    scope.chooser = activityChooser;
                    scope.selected = null;

                    function move(diff, items) {
                        var index = _.indexOf(items, scope.selected),
                            next = _.max([0, _.min([items.length - 1, index + diff])]);

                        scope.selected = items[next];
                    }

                    scope.$watch(function watchActivities() {
                        return activityChooser.activities;
                    }, (activities, prev) => {
                        scope.selected = activities ? _.head(activities) : null;

                        if (activities) {
                            keyboardManager.push('up', () => {
                                move(UP, activities);
                            });

                            keyboardManager.push('down', () => {
                                move(DOWN, activities);
                            });

                            keyboardManager.push('enter', () => {
                                activityChooser.resolve(scope.selected);
                            });
                        } else if (prev) {
                            keyboardManager.pop('up');
                            keyboardManager.pop('down');
                            keyboardManager.pop('enter');
                        }
                    });

                    scope.select = function(activity) {
                        scope.selected = activity;
                    };
                }
            };
        }]);
