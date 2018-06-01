import * as helpers from 'apps/authoring/authoring/helpers';

AuthoringEmbeddedDirective.$inject = ['api', 'notify', 'gettext', '$filter', 'config'];
export function AuthoringEmbeddedDirective(api, notify, gettext, $filter, config) {
    return {
        templateUrl: 'scripts/apps/authoring/views/authoring.html',
        scope: {
            item: '=',
            action: '='
        },
        link: function(scope) {
            if (scope.action === 'kill' || scope.action === 'takedown') {
                // kill template is applied on the item.
                // task is required to get the desk name.
                var fields = _.union(_.keys(helpers.CONTENT_FIELDS_DEFAULTS), ['_id', 'versioncreated', 'task']);
                var item = {
                    template_name: scope.action, item: _.pick(scope.item, fields)
                };

                api.save('content_templates_apply', {}, item, {}).then((result) => {
                    item = _.pick(result, _.keys(helpers.CONTENT_FIELDS_DEFAULTS));
                    scope.origItem = angular.extend({}, scope.item);
                    _.each(item, (value, key) => {
                        scope.origItem[key] = value;
                    });
                }, (err) => {
                    notify.error(gettext('Failed to apply kill template to the item.'));
                });
            } else {
                if (scope.action === 'correct') {
                    scope.item.ednote = gettext('In the story "') + scope.item.slugline + gettext('" sent at: ') +
                    $filter('formatLocalDateTimeString')(scope.item.versioncreated, config.view.dateformat + ' ' +
                        config.view.timeformat) +
                    gettext('\r\n\r\nThis is a corrected repeat.');
                    scope.item.flags.marked_for_sms = false;
                    scope.item.sms_message = '';
                }
                scope.origItem = scope.item;
            }
        }
    };
}
