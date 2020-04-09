import {IArticle, IArticleField} from 'superdesk-api';
import {gettext} from 'core/utils';

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
    field: IArticleField;
    preview: boolean;
    loading: boolean;
    relatedItems: Array<IArticle>;
    gettext: (text: string, params?: any) => string;
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
            scope.gettext = gettext;

            relationsService.getRelatedItemsForField(scope.item, scope.field._id)
                .then((items) => {
                    scope.relatedItems = items;
                    scope.loading = false;
                });
        },
    };
}
