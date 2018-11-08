// services
import {RelationsService} from './services/RelationsService';
import {RelatedItemsDirective} from './directives/RelatedItemsDirective';

angular.module('superdesk.apps.relations', ['superdesk.apps.archive'])
    .service('relationsService', RelationsService)
    .directive('sdRelatedItems', RelatedItemsDirective);
