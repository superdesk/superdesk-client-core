import _ from 'lodash';
import * as helpers from 'apps/authoring/authoring/helpers';
import {gettext} from 'core/utils';
import {appConfig, authoringReactViewEnabled} from 'appConfig';
import {canPrintPreview} from 'apps/search/helpers';
import {IFullWidthPageCapabilityConfiguration} from 'superdesk-api';

AuthoringEmbeddedDirective.$inject = ['superdeskFlags', 'api', 'notify', '$filter'];
export function AuthoringEmbeddedDirective(superdeskFlags, api, notify, $filter) {
    return {
        template: authoringReactViewEnabled
            ? (
                '<div>' +
                    '<sd-authoring-integration-wrapper ' +
                        'data-action="action" ' +
                        'data-item-id="item._id" ' +
                        'data-hide-monitoring="hideMonitoring" ' +
                        'data-is-expanded="isExpanded">' +
                    '</sd-authoring-react>' +
                '</div>'
            )
            : undefined,
        templateUrl: authoringReactViewEnabled ? undefined : 'scripts/apps/authoring/views/authoring.html',
        scope: {
            item: '=',
            action: '=',
        },
        link: function(scope) {
            scope.canPrintPreview = canPrintPreview;
            scope.isExpanded = superdeskFlags.flags.hideMonitoring;

            scope.hideMonitoring = function(state, e) {
                const fullWidthConfig: IFullWidthPageCapabilityConfiguration
                    = scope.$parent.$parent.$parent.fullWidthConfig;

                if (fullWidthConfig.enabled) {
                    if (fullWidthConfig.allowed) {
                        fullWidthConfig.onToggle(!scope.fullWidthEnabled);
                    }
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (superdeskFlags.flags.authoring && state) {
                        e.preventDefault();
                        superdeskFlags.flags.hideMonitoring = !superdeskFlags.flags.hideMonitoring;
                        scope.isExpanded = superdeskFlags.flags.hideMonitoring;
                        scope.$applyAsync();
                    } else {
                        superdeskFlags.flags.hideMonitoring = false;
                    }
                }
            };

            function overrideEdnote(template) {
                /* Override Editor note with given template or default one
                 *
                 * @param {string} template - template to use (set in backend)
                 */
                let date = $filter('formatLocalDateTimeString')(scope.item.versioncreated, appConfig.view.dateformat +
                    ' ' + appConfig.view.timeformat);

                if (template == null) {
                    const lineBreak = '\r\n\r\n';
                    // no template specified in backend, we use default one
                    let slugline = scope.item.slugline ? '"' + scope.item.slugline + '"' : '';

                    scope.item.ednote = gettext(
                        'In the story {{slugline}} sent at: {{date}}.{{lineBreak}}This is a corrected repeat.',
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
                const {override_ednote_for_corrections, override_ednote_template} = appConfig;

                if (override_ednote_for_corrections) {
                    overrideEdnote(override_ednote_template);
                }

                scope.origItem = scope.item;
                scope.item.flags.marked_for_sms = false;
                scope.item.sms_message = '';
            } else {
                scope.origItem = scope.item;
            }
        },
    };
}
