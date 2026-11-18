import {reactToAngular1} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {EditorialActionsPage} from './components/EditorialActionsPage';

const styles = 'display: flex; height: 100%;';

angular.module('superdesk.apps.ai-studio', [])
    .component('sdAiStudioEditorialActions', reactToAngular1(EditorialActionsPage, [], [], styles))
    .config(['superdeskProvider', (superdeskProvider) => {
        // Each AI Studio page gets its own path under /ai-studio, so adding pages keeps this URL
        superdeskProvider
            .activity('/ai-studio/editorial-actions', {
                label: gettext('AI Studio'),
                template: require('./views/editorial-actions.html'),
                category: superdeskProvider.MENU_MAIN,
                adminTools: true,
                privileges: {ai_studio: 1},
            });
    }]);
