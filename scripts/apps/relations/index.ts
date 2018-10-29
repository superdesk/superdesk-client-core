// services
import * as svc from './services/RelationsService';

angular.module('superdesk.apps.relations', [])
    .service('RelationsService', svc.RelationsService);
