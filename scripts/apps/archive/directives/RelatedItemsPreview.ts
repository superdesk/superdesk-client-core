import {IArticle} from 'superdesk-api';
import {IVocabulary} from 'superdesk-interfaces/Vocabulary';

/**
 * @ngdoc directive
 * @module superdesk.apps.archive
 * @name sdRelatedItemsPreview
 *
 * @requires relationsService
 *
 * @description Renders the preview of the related items.
 *
 */

interface IScope extends ng.IScope {
    item: IArticle;
    field: IVocabulary;
    preview: boolean;
    loading: boolean;
    relatedItems: Array<IArticle>;
}

RelatedItemsPreview.$inject = ['relationsService'];

export function RelatedItemsPreview(relationsService) {
    return {
        scope: {
            item: '=',
            field: '<',
            preview: '=?',
        },
        template: require('../views/related-items-preview.html'),
        link: function(scope: IScope) {
            scope.loading = true;
            relationsService.getRelatedItemsForField(scope.item, scope.field._id)
                .then((items) => {
                    scope.relatedItems = items;
                    scope.loading = false;
                });
        },
    };
}
