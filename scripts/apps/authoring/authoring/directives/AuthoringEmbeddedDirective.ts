import _ from 'lodash';
import * as helpers from 'apps/authoring/authoring/helpers';
import {gettext} from 'core/ui/components/utils';

AuthoringEmbeddedDirective.$inject = ['api', 'notify', '$filter', 'config', 'deployConfig'];
export function AuthoringEmbeddedDirective(api, notify, $filter, config, deployConfig) {
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
                    const lineBreak = '\r\n\r\n';
                    // no template specified in backend, we use default one
                    let slugline = scope.item.slugline ? '"' + scope.item.slugline + '" ' : '';

                    scope.item.ednote = gettext(
                        'In the story {{slugline}} sent at: {{date}} {{lineBreak}}. This is corrected repeat.',
                        {slugline, date, lineBreak});
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
                var item: any = {
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
