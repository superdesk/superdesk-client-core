/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/dictionaries.scss';

import {DictionaryService} from './services';
import {DictionaryEditController, DictionaryConfigController} from './controllers';
import * as directive from './directives';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/utils';

/**
 * @ngdoc module
 * @module superdesk.apps.dictionaries
 * @name superdesk.apps.dictionaries
 * @packageName superdesk.apps
 * @description Superdesk module that adds dictionary functionality.
 */
angular.module('superdesk.apps.dictionaries', [
    'vs-repeat',
    'superdesk.core.activity',
    'superdesk.core.upload',
])
    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/settings/dictionaries', {
            label: gettext('Dictionaries'),
            controller: DictionaryConfigController,
            templateUrl: 'scripts/apps/dictionaries/views/settings.html',
            category: superdesk.MENU_SETTINGS,
            settings_menu_group: coreMenuGroups.CONTENT_CONFIG,
            priority: -800,
            privileges: {dictionaries: 1},
        });
    }])
    .service('dictionaries', DictionaryService)
    .controller('DictionaryEdit', DictionaryEditController)
    .directive('sdDictionaryConfig', () => ({controller: DictionaryConfigController}))
    .directive('sdDictionaryConfigModal', directive.DictionaryConfigModal)
    .directive('fileUpload', directive.FileUpload);
