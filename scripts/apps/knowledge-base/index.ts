import {reactToAngular1} from 'superdesk-ui-framework';
import {KnowledgeBasePage} from './knowledge-base-page';

const styles = 'display: flex; height: 100%; padding-top: 48px';

angular.module('superdesk.apps.knowledge-base', [
    'superdesk.core.api',
    'superdesk.apps.publish',
    'superdesk.apps.search',
])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/knowledge-base', {
                label: gettext('Knowledge base'),
                category: superdesk.MENU_MAIN,
                adminTools: true,
                template: '<sd-knowledge-base-page></sd-knowledge-base-page>',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            });
    }])
    .component('sdKnowledgeBasePage', reactToAngular1(KnowledgeBasePage, [], [], styles));
