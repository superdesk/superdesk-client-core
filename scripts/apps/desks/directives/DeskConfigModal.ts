import {gettext} from 'core/utils';
import {appConfig} from '../../../appConfig';
import {getLabelForStage} from 'apps/workspace/content/constants';

/**
 * @ngdoc directive
 * @module superdesk.apps.desks
 * @name sdDeskConfigModal
 *
 * @requires metadata
 * @requires content
 * @requires api
 *
 * @description Generates modal for editing desks
 */

DeskConfigModal.$inject = ['metadata', 'content', 'templates', 'api'];
export function DeskConfigModal(metadata, content, templates, api) {
    return {
        scope: {
            modalActive: '=active',
            desk: '=',
            step: '=',
            desks: '=',
            cancel: '&',
            canTabChange: '&',
        },
        require: '^sdDeskConfig',
        templateUrl: 'scripts/apps/desks/views/desk-config-modal.html',
        link: function(scope, elem, attrs, ctrl) {
            const views = {};

            views[''] = {label: gettext('None')};
            views['list'] = {label: gettext('List View'), icon: 'list-view'};

            if (appConfig.features.swimlane != null) {
                views['swimlane'] = {label: gettext('Swimlane View'), icon: 'kanban-view'};
            }

            views['photogrid'] = {label: gettext('Photo Grid View'), icon: 'grid-view'};

            scope.monitoringViews = views;

            scope.labelForStage = getLabelForStage;

            /*
             * Initialize metadata
             * @return {Object} metadata
             */
            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
            });

            scope.systemExpiry = appConfig.content_expiry_minutes;
            /*
             * Initialize content types
             * @return {Object} profiles
             */
            content.getTypes().then((profiles) => {
                scope.profiles = profiles;
            });

            /*
             * Initialize languages
             * @return {Object} languages
             */
            api.query('languages').then((languages) => {
                scope.languages = languages._items;
            });

            scope.$watch('desk', (desk) => {
                scope.templates = null;
                if (desk) {
                    templates.fetchTemplatesByDesk(desk._id).then((data) => {
                        scope.templates = data._items;
                    });
                }
            });
        },
    };
}
