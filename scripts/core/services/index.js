/**
 * @ngdoc module
 * @module superdesk.core.services
 * @name superdesk.core.services
 * @packageName superdesk.core
 * @description Various core services that can be used with Superdesk.
 */
import './translate';
import './preferencesService';
import './permissionsService';
import './data';
import './entity';
import './server';
import './storage';
import './dragDropService';
import './modalService';
import './workflowService';
import './asset';
import './image-factory';
import './pageTitle';

import {ServerConfigService} from './serverConfig';

angular.module('superdesk.core.services', [
    'superdesk.core.services.beta',
    'superdesk.core.services.data',
    'superdesk.core.services.modal',
    'superdesk.core.services.dragdrop',
    'superdesk.core.services.server',
    'superdesk.core.services.entity',
    'superdesk.core.services.permissions',
    'superdesk.core.services.storage',
    'superdesk.core.services.pageTitle'
])
        .service('serverConfig', ServerConfigService);
