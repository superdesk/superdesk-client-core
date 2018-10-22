/**
 * This file is part of Superdesk.
 *
 * Copyright 2013-2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/vocabularies.scss';

import {VocabularyService, SchemaFactory} from './services';
import * as ctrl from './controllers';
import * as directive from './directives';
import { coreMenuGroups } from 'core/activity/activity';

/**
 * @ngdoc module
 * @module superdesk.apps.vocabularies
 * @name superdesk.apps.vocabularies
 * @packageName superdesk.apps
 * @description Superdesk vocabularies module.
 */
angular.module('superdesk.apps.vocabularies', [
    'superdesk.core.activity',
])
    .service('vocabularies', VocabularyService)

    .controller('VocabularyEdit', ctrl.VocabularyEditController)
    .controller('VocabularyConfig', ctrl.VocabularyConfigController)

    .directive('sdVocabularyConfig', directive.VocabularyConfigDirective)
    .directive('sdVocabularyConfigModal', directive.VocabularyConfigModal)
    .directive('sdVocabularyObjectField', directive.VocabularyObjectField)
    .directive('sdVocabularyConfigModalItems', directive.VocabularyConfigModalItems)

    .factory('cvSchema', SchemaFactory)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/settings/vocabularies', {
            label: gettext('Metadata'),
            templateUrl: 'scripts/apps/vocabularies/views/settings.html',
            category: superdesk.MENU_SETTINGS,
            settings_menu_group: coreMenuGroups.CONTENT_CONFIG,
            priority: -800,
            privileges: {vocabularies: 1},
        });
    }]);
