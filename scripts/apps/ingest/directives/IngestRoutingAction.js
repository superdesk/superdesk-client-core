import {gettext} from 'core/ui/components/utils';

IngestRoutingAction.$inject = ['desks', 'macros', 'subscribersService', 'metadata'];
export function IngestRoutingAction(desks, macros, subscribersService, metadata) {
    return {
        scope: {rule: '='},
        templateUrl: 'scripts/apps/ingest/views/settings/ingest-routing-action.html',
        link: function(scope) {
            scope.newFetch = {};
            scope.newPublish = {};
            scope.deskLookup = {};
            scope.stageLookup = {};
            scope.macroLookup = {};
            scope.customSubscribers = [];
            scope.target_types = [];

            desks.initialize()
                .then(() => {
                    scope.deskLookup = desks.deskLookup;
                    scope.stageLookup = desks.stageLookup;
                });

            macros.get(true).then((macros) => {
                _.transform(macros, (lookup, macro, idx) => {
                    scope.macroLookup[macro.name] = macro;
                });
            });

            subscribersService.fetchActiveSubscribers().then((items) => {
                scope.customSubscribers = [];
                _.each(items, (item) => {
                    scope.customSubscribers.push({_id: item._id, name: item.name});
                });
            });

            metadata.initialize()
                .then(() => {
                    scope.target_types = metadata.values.subscriberTypes;
                });

            scope.getActionString = function(action) {
                if (scope.deskLookup[action.desk] && scope.stageLookup[action.stage]) {
                    var actionValues = [];

                    actionValues.push(scope.deskLookup[action.desk].name);
                    actionValues.push(scope.stageLookup[action.stage].name);
                    if (action.macro) {
                        actionValues.push(scope.macroLookup[action.macro].label ||
                            scope.macroLookup[action.macro].name);
                    } else {
                        actionValues.push(' - ');
                    }
                    if (action.target_subscribers && action.target_subscribers.length > 0) {
                        actionValues.push(_.map(action.target_subscribers, 'name').join(','));
                    } else {
                        actionValues.push(' - ');
                    }
                    if (action.target_types && action.target_types.length > 0) {
                        var targets = [];

                        _.forEach(action.target_types, (targetType) => {
                            targets.push((!targetType.allow ? gettext('Not ') : '') + targetType.name);
                        });
                        actionValues.push(targets.join(','));
                    }

                    return actionValues.join(' / ');
                }
            };

            scope.addFetch = function() {
                if (scope.newFetch.desk && scope.newFetch.stage) {
                    scope.rule.actions.fetch.push(scope.newFetch);
                    scope.newFetch = {};
                }
            };

            scope.removeFetch = function(fetchAction) {
                _.remove(scope.rule.actions.fetch, (f) => f === fetchAction);
            };

            scope.addPublish = function() {
                if (scope.newPublish.desk && scope.newPublish.stage) {
                    scope.rule.actions.publish.push(scope.newPublish);
                    scope.newPublish = {};
                    scope.newPublish.target_subscribers = [];
                    scope.newPublish.target_types = [];
                }
            };

            scope.removePublish = function(publishAction) {
                _.remove(scope.rule.actions.publish, (p) => p === publishAction);
            };
        },
    };
}
