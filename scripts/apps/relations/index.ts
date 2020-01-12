// services
import {RelationsService} from './services/RelationsService';
import {RelatedItemsDirective} from './directives/RelatedItemsDirective';
import {RelatedItemInListComponent} from './components/RelatedItemInList';
import {reactToAngular1} from 'superdesk-ui-framework';

angular.module('superdesk.apps.relations', ['superdesk.apps.archive'])
    .service('relationsService', RelationsService)
    .component('sdRelatedItemInListReact', reactToAngular1(RelatedItemInListComponent, ['item']))
    .directive('sdRelatedItems', RelatedItemsDirective);
