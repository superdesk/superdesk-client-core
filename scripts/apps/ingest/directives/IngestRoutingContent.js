/**
 * @ngdoc directive
 * @module superdesk.apps.ingest
 * @name sdIngestRoutingContent
 * @description
 *   Creates the main page for adding or editing routing rules (in the
 *   modal for editing ingest routing schemes).
 */
IngestRoutingContent.$inject = ['api', 'gettext', 'notify', 'modal', 'contentFilters', '$filter'];
export function IngestRoutingContent(api, gettext, notify, modal, contentFilters, $filter) {
    return {
        templateUrl: 'scripts/apps/ingest/views/settings/ingest-routing-content.html',
        link: function(scope) {
            var filtersStartPage = 1, // the fetch results page to start from
                _orig = null;

            scope.editScheme = null;
            scope.rule = null;
            scope.ruleIndex = null;
            scope.schemes = [];
            scope.contentFilters = [];

            function initSchemes() {
                api('routing_schemes').query()
                    .then((result) => {
                        scope.schemes = $filter('sortByName')(result._items);
                    });

                contentFilters.getAllContentFilters(
                    filtersStartPage, scope.contentFilters
                )
                    .then((filters) => {
                        scope.contentFilters = filters;
                    });
            }

            initSchemes();

            function confirm(context) {
                if (context === 'scheme') {
                    return modal.confirm(gettext('Are you sure you want to delete this scheme?'));
                } else if (context === 'rule') {
                    return modal.confirm(gettext('Are you sure you want to delete this scheme rule?'));
                }
            }

            scope.edit = function(scheme) {
                scope.editScheme = _.clone(scheme);
                scope.editScheme.rules = _.clone(scheme.rules || []);
                _orig = scheme;
            };

            scope.save = function() {
                if (scope.rule) {
                    if (scope.ruleIndex === -1) {
                        scope.editScheme.rules.push(scope.rule);
                    } else {
                        scope.editScheme.rules[scope.ruleIndex] = scope.rule;
                    }
                }

                scope.editScheme.rules = _.reject(scope.editScheme.rules, {name: null});

                const diff = _.cloneDeep(scope.editScheme);

                _.forEach(diff.rules, (r) => {
                    // filterName was only needed to display it in the UI
                    delete r.filterName;

                    // only need for display
                    delete r.schedule._allDay;
                });

                var _new = !scope.editScheme._id;

                api('routing_schemes').save(_orig, diff)
                    .then(() => {
                        if (_new) {
                            scope.schemes.push(_orig);
                        }
                        scope.schemes = $filter('sortByName')(scope.schemes);
                        notify.success(gettext('Routing scheme saved.'));
                        scope.cancel();
                    }, (response) => {
                        notify.error(gettext('I\'m sorry but there was an error when saving the routing scheme.'));
                    });
            };

            scope.cancel = function() {
                scope.editScheme = null;
                scope.rule = null;
                scope.ruleIndex = null;
                scope.schemes = [];
                scope.contentFilters = [];
                initSchemes();
            };

            scope.remove = function(scheme) {
                confirm('scheme').then(() => {
                    api('routing_schemes').remove(scheme)
                        .then((result) => {
                            _.remove(scope.schemes, scheme);
                        }, (response) => {
                            if (angular.isDefined(response.data._message)) {
                                notify.error(gettext('Error: ' + response.data._message));
                            } else {
                                notify.error(gettext('There was an error. Routing scheme cannot be deleted.'));
                            }
                        });
                });
            };

            scope.removeRule = function(rule) {
                confirm('rule').then(() => {
                    if (rule === scope.rule) {
                        scope.rule = null;
                    }
                    _.remove(scope.editScheme.rules, rule);
                });
            };

            scope.addRule = function() {
                var rule = {
                    name: null,
                    filter: null,
                    actions: {
                        fetch: [],
                        publish: [],
                        exit: false,
                    },
                    schedule: {
                        day_of_week: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
                        hour_of_day_from: null,
                        hour_of_day_to: null,
                        _allDay: true,
                    },
                };

                scope.editScheme.rules.push(rule);
                scope.editRule(rule);
            };

            /**
             * Opens the given routing scheme rule for editing.
             *
             * @method editRule
             * @param {Object} rule - routing scheme rule's config data
             */
            scope.editRule = function(rule) {
                let filter;

                scope.rule = rule;

                filter = _.find(scope.contentFilters, {_id: rule.filter});
                if (filter) {
                    // filterName needed to display it in the UI
                    scope.rule.filterName = filter.name;
                }

                scope.rule.schedule._allDay = !(_.get(scope.rule, 'schedule.hour_of_day_from', false) ||
                    _.get(scope.rule, 'schedule.hour_of_day_to', false));
            };

            scope.reorder = function(start, end) {
                scope.editScheme.rules.splice(end, 0, scope.editScheme.rules.splice(start, 1)[0]);
            };

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @description Checks if the schemeForm is invalid
             * @returns {Boolean} True if schemeForm is invalid. False if valid
             */
            scope.disableSchemeForm = function() {
                return !scope.editScheme.name || scope.editScheme.rules.filter((rule) => !rule.name).length > 0;
            };
        },
    };
}
