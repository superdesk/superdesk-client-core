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
        link: function (scope) {
            let _orig = null;

            const DEFAULT_DATA = {
                name: null,
                filter: null,
                actions: {
                    fetch: [],
                    publish: [],
                    exit: false
                },
                schedule: {
                    day_of_week: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
                    hour_of_day_from: null,
                    hour_of_day_to: null,
                    _allDay: true
                }
            };

            scope.editScheme = null;
            scope.selectedRule = null;
            scope.rule = null;
            scope.schemes = [];
            scope.contentFilters = [];

            initSchemes();

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @param {Object} scheme Scheme data
             * @description Initiate edit modal
             */
            scope.edit = (scheme) => {
                scope.editScheme = _.clone(scheme);
                scope.editScheme.rules = _.clone(scheme.rules || []);
                _orig = scheme;
            };

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @param {Object} scheme Scheme data
             * @description Remove complete scheme
             */
            scope.remove = (scheme) => confirm('scheme').then(() => {
                api('routing_schemes').remove(scheme).then(() => {
                    _.remove(scope.schemes, scheme);
                }, (response) => {
                    angular.isDefined(response.data._message) ?
                        notify.error(gettext('Error: ' + response.data._message)) :
                        notify.error(gettext('There was an error. Routing scheme cannot be deleted.'));
                });
            });
            
            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @description Close Ingest Routing editing modal
             */
            scope.cancel = () => {
                scope.editScheme = null;
                scope.selectedRule = null;
                scope.rule = null;
                scope.schemes = [];
                scope.contentFilters = [];

                initSchemes();
            };
            
            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @description Close Ingest Routing editing modal
             */
            scope.done = () => {
                scope.save().then(() => {
                    scope.cancel();
                });
            };

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @param {Object} rule Routing scheme rule's config data
             * @description Pick up rule for preview.
             */
            scope.selectRule = (rule) => scope.selectedRule = rule;
            
            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @description Create new rule with default data
             */
            scope.addRule = () => {
                let rule = angular.copy(DEFAULT_DATA);
                scope.editScheme.rules.push(rule);
                scope.editRule(rule);
            };

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @param {Object} rule Routing scheme rule's config data
             * @description Opens the given routing scheme rule for editing.
             */
            scope.editRule = (rule) => {
                scope.rule = rule;
                scope.rule.filterName = rule.filter ? _.find(scope.contentFilters, {_id: rule.filter}).name : null;
                scope.rule.schedule._allDay = !(_.get(scope.rule, 'schedule.hour_of_day_from', false) ||
                    _.get(scope.rule, 'schedule.hour_of_day_to', false));
            };
            
            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @param {Object} rule Routing scheme rule's config data
             * @description Opens the given routing scheme rule for editing.
             */
            scope.save = () => {
                let diff = _.cloneDeep(scope.editScheme);

                _.forEach(diff.rules, (r) => {
                    // filterName was only needed to display it in the UI
                    delete r.filterName;
                    // only need for display
                    delete r.schedule._allDay;
                });

                return api('routing_schemes').save(_orig, diff).then((result) => {
                    !scope.editScheme._id ? 
                       scope.schemes.push(_orig) : null;

                   scope.schemes = $filter('sortByName')(scope.schemes);
                   notify.success(gettext('Routing scheme saved.'));
                   scope.rule = null;
                   initSchemes();

               }, (response) => {
                   notify.error(gettext('I\'m sorry but there was an error when saving the routing scheme.'));
               });
            };

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @param {Object} rule Routing scheme rule's config data
             * @description Remove rule from list
             */
            scope.removeRule = (rule) => confirm('rule').then(() => {
                _.remove(scope.editScheme.rules, rule);
                scope.selectedRule = null;
                scope.rule = null;
            });

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @description Reorder schema rules
             */
            scope.reorder = (start, end) => {
                scope.editScheme.rules.splice(end, 0, scope.editScheme.rules.splice(start, 1)[0]);
            };

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @description Cancel adding or editing schema rule
             */
            scope.cancelRule = () => {
                !scope.rule._id ? scope.editScheme.rules.splice(-1, 1) : null;
                scope.rule = null;
            };

            /**
             * @ngdoc method
             * @name sdIngestRoutingContent#disableSchemeForm
             * @description Checks if the schemeForm is invalid
             * @returns {Boolean} True if schemeForm is invalid. False if valid
             */
            scope.disableSchemeForm = 
                scope.editScheme && (!scope.editScheme.name || scope.editScheme.rules.filter((rule) => !rule.name).length > 0);

            /**
             * @ngdoc function
             * @name sdIngestRoutingContent#disableSchemeForm
             * @param {String} context Type of confirmation modal
             * @description Generate confirmation modal
             * @returns {Boolean} modal Based on context
             */
            function confirm(context) {
                return context === 'scheme' ?
                        modal.confirm(gettext('Are you sure you want to delete this scheme?')) :
                        modal.confirm(gettext('Are you sure you want to delete this scheme rule?'));
            }

            /**
             * @ngdoc function
             * @name sdIngestRoutingContent#disableSchemeForm
             * @description Function for initialization default routing schemas
             */
            function initSchemes() {
                api('routing_schemes').query().then((result) => {
                    scope.schemes = $filter('sortByName')(result._items);
                });

                contentFilters.getAllContentFilters(1, scope.contentFilters).then((filters) => {
                    scope.contentFilters = filters;
                });
            }
        }
    };
}
