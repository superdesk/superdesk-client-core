import * as helpers from 'apps/authoring/authoring/helpers';
import {gettext} from 'core/ui/components/utils';

AuthoringEmbeddedDirective.$inject = ['api', 'notify', '$filter', 'config', 'deployConfig', '$interpolate'];
export function AuthoringEmbeddedDirective(api, notify, $filter, config, deployConfig, $interpolate) {
    return {
        templateUrl: 'scripts/apps/authoring/views/authoring.html',
        scope: {
            item: '=',
            action: '=',
        },
        link: function(scope) {
            function overrideEdnote(template) {
                /* Override Editor note with given template or default one
                 *
                 * @param {string} template - template to use (set in backend)
                 */
                let date = $filter('formatLocalDateTimeString')(scope.item.versioncreated, config.view.dateformat +
                    ' ' + config.view.timeformat);

                if (template == null) {
                    // no template specified in backend, we use default one
                    let slugline = scope.item.slugline ? '"' + scope.item.slugline + '" ' : '';

                    scope.item.ednote = gettext('In the story {{ slugline }} sent at: {{ date }}\r\n' +
                        '\r\nThis is corrected repeat.', {slugline, date});
                } else {
                    // we use template from backend
                    scope.item.ednote = template
                        .replace('{date}', date)
                        .replace('{slugline}', scope.item.slugline || '');
                }
            }
            if (scope.action === 'kill' || scope.action === 'takedown') {
                // kill template is applied on the item.
                // task is required to get the desk name.
                var fields = _.union(_.keys(helpers.CONTENT_FIELDS_DEFAULTS), ['_id', 'versioncreated', 'task']);
                var item = {
                    template_name: scope.action, item: _.pick(scope.item, fields),
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
            } else if (scope.action === 'correct') {
                deployConfig.all({
                    override: 'override_ednote_for_corrections',
                    template: 'override_ednote_template',
                }).then((config) => {
                    if (config.override) {
                        overrideEdnote(config.template);
                    }
                    scope.origItem = scope.item;
                });
                scope.item.flags.marked_for_sms = false;
                scope.item.sms_message = '';
            } else {
                scope.origItem = scope.item;
            }
        },
    };
}
