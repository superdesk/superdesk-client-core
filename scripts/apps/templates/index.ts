/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/templates.scss';

import {TemplatesService} from './services';
import {FilterTemplatesFilter} from './filters';
import * as directive from './directives';
import * as ctrl from './controllers';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/utils';
import {reactToAngular1} from 'superdesk-ui-framework';
import {AuthoringAngularTemplateIntegration} from 'apps/authoring-react/authoring-angular-template-integration';

angular.module('superdesk.apps.templates', [
    'superdesk.core.activity',
    'superdesk.apps.authoring',
    'superdesk.core.preferences',
])
    .service('templates', TemplatesService)

    .filter('templatesBy', FilterTemplatesFilter)

    .directive('sdTemplates', directive.TemplatesDirective)
    .directive('sdTemplateEditorModal', directive.TemplateEditorModal)
    .component(
        'sdEditTemplate',
        reactToAngular1(
            AuthoringAngularTemplateIntegration,
            ['template', 'scopeApply'],
            [],
            'height: 100%;',
        ))

    .controller('CreateTemplateController', ctrl.CreateTemplateController)
    .controller('TemplateMenu', ctrl.TemplateMenuController)

    .config(['superdeskProvider', 'apiProvider', function config(superdesk, apiProvider) {
        superdesk.activity('/settings/templates', {
            label: gettext('Templates'),
            templateUrl: 'scripts/apps/templates/views/settings.html',
            controller: ctrl.TemplatesSettingsController,
            category: superdesk.MENU_SETTINGS,
            settings_menu_group: coreMenuGroups.CONTENT_CONFIG,
            priority: 2000,
        });
    }]);
