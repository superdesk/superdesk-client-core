import _ from 'lodash';
import {gettext} from 'core/utils';

IngestRulesContent.$inject = ['api', 'notify', 'modal', '$filter'];
export function IngestRulesContent(api, notify, modal, $filter) {
    return {
        templateUrl: 'scripts/apps/ingest/views/settings/ingest-rules-content.html',
        link: function(scope) {
            var _orig = null;

            scope.editRuleset = null;

            api('rule_sets').query()
                .then((result) => {
                    scope.rulesets = $filter('sortByName')(result._items);
                });

            scope.edit = function(ruleset) {
                scope.editRuleset = _.create(ruleset);
                scope.editRuleset.rules = ruleset.rules || [];
                _orig = ruleset;
            };

            scope.save = function(ruleset) {
                var _new = !ruleset._id;

                api('rule_sets').save(_orig, ruleset)
                    .then(() => {
                        if (_new) {
                            scope.rulesets.push(_orig);
                        }

                        scope.rulesets = $filter('sortByName')(scope.rulesets);
                        notify.success(gettext('Rule set saved.'));
                        scope.cancel();
                    }, (response) => {
                        notify.error(gettext('I\'m sorry but there was an error when saving the rule set.'));
                    });
            };

            scope.cancel = function() {
                scope.editRuleset = null;
            };

            scope.remove = function(ruleset) {
                confirm().then(() => {
                    api('rule_sets').remove(ruleset)
                        .then((result) => {
                            _.remove(scope.rulesets, ruleset);
                        }, (response) => {
                            if (angular.isDefined(response.data._message)) {
                                notify.error(gettext('Error: ' + response.data._message));
                            } else {
                                notify.error(gettext('There was an error. Rule set cannot be deleted.'));
                            }
                        });
                });
            };

            function confirm() {
                return modal.confirm(gettext('Are you sure you want to delete rule set?'));
            }

            scope.removeRule = function(rule) {
                _.remove(scope.editRuleset.rules, rule);
            };

            scope.addRule = function() {
                if (!scope.editRuleset.rules) {
                    scope.editRuleset.rules = [];
                }
                scope.editRuleset.rules.push({old: null, new: null});
            };

            scope.reorder = function(start, end) {
                scope.editRuleset.rules.splice(end, 0, scope.editRuleset.rules.splice(start, 1)[0]);
            };
        },
    };
}
