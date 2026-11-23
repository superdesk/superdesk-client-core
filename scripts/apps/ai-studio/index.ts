import {reactToAngular1} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {EditorialActionsPage} from './components/editorial-actions-page';

const EDITORIAL_ACTIONS_PATH = '/ai-studio/editorial-actions';

const styles = 'display: flex; height: 100%;';

angular.module('superdesk.apps.ai-studio', [])
    .component('sdAiStudioEditorialActions', reactToAngular1(EditorialActionsPage, [], [], styles))
    .config(['superdeskProvider', '$routeProvider', (superdeskProvider, $routeProvider) => {
        // Each AI Studio page gets its own path under /ai-studio, which opens the first one
        $routeProvider.when('/ai-studio', {redirectTo: EDITORIAL_ACTIONS_PATH});

        superdeskProvider
            .activity(EDITORIAL_ACTIONS_PATH, {
                label: gettext('AI Studio'),
                template: require('./views/editorial-actions.html'),
                category: superdeskProvider.MENU_MAIN,
                adminTools: true,
                privileges: {ai_studio: 1},
            });
    }]);
