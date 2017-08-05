/**
 * This file is part of Superdesk.
 *
 * Copyright 2017 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/knowledge.scss';

import * as ctrl from './controllers';
import * as directive from './directives';

/**
 * @ngdoc module
 * @module superdesk.apps.knowledge
 * @name superdesk.apps.knowledge
 * @packageName superdesk.apps
 * @description Superdesk knowledge base support.
 */
export default angular.module('superdesk.apps.knowledge', ['superdesk.apps.users'])
    .directive('sdConceptItemList', directive.ConceptItemList)

    .controller('KnowledgeController', ctrl.KnowledgeController)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/knowledge', {
                label: gettext('Knowledge Base'),
                templateUrl: 'scripts/apps/knowledge/views/knowledge.html',
                controller: ctrl.KnowledgeController,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                privileges: {concept_items: 1}
            });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('concept_items', {
            type: 'http',
            backend: {rel: 'concept_items'}
        });
    }]);
