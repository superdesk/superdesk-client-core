/**
 * This file is part of Superdesk.
 *
 * Copyright 2013-2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/vocabularies.less';

import { VocabularyService, SchemaFactory } from './services';
import * as ctrl from './controllers';
import * as directive from './directives';

angular.module('superdesk.apps.vocabularies', [
    'superdesk.activity',
    'superdesk.apps.authoring.metadata'
])
    .service('vocabularies', VocabularyService)

    .controller('VocabularyEdit', ctrl.VocabularyEditController)
    .controller('VocabularyConfig', ctrl.VocabularyConfigController)

    .directive('sdVocabularyConfig', directive.VocabularyConfigDirective)
    .directive('sdVocabularyConfigModal', directive.VocabularyConfigModal)

    .factory('cvSchema', SchemaFactory)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/settings/vocabularies', {
            label: gettext('Vocabularies'),
            templateUrl: 'scripts/apps/vocabularies/views/settings.html',
            category: superdesk.MENU_SETTINGS,
            priority: -800,
            privileges: {vocabularies: 1}
        });
    }]);
