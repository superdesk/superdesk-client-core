/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as directive from './directives';
import * as svc from './services';

/**
 * @ngdoc module
 * @module superdesk.apps.translations
 * @name superdesk.apps.translations
 * @packageName superdesk.apps
 * @description Superdesk authoring application module.
 */
angular.module('superdesk.apps.translations', [
    'superdesk.core.api'
])

    .service('TranslationService', svc.TranslationService)

    .directive('sdTranslationDropdown', directive.TranslationDropdown)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('translate', {
                label: gettext('Translate'),
                icon: 'globe',
                dropdown: directive.TranslationReactDropdown,
                keyboardShortcut: 'ctrl+t',
                templateUrl: 'scripts/apps/translations/views/TranslationDropdownTemplate.html',
                filters: [
                    {action: 'list', type: 'archive'}
                ],
                additionalCondition: ['TranslationService', 'item', function(TranslationService, item) {
                    return TranslationService.checkAvailability(item);
                }]
            });
    }]);
