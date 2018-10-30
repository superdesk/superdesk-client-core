// services
import {RelationsService} from './services/RelationsService';

angular.module('superdesk.apps.relations', ['superdesk.apps.archive'])
    .service('relationsService', RelationsService);
