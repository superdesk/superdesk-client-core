import {IArticle, IArticleField, IRendition} from 'superdesk-api';
import {gettext} from 'core/utils';
import {getThumbnailForItem} from 'core/helpers/item';

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
    getThumbnailForItem: (item: IArticle) => IRendition;
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
            scope.getThumbnailForItem = getThumbnailForItem;

            scope.$watch('item', (item) => {
                relationsService.getRelatedItemsForField(item, scope.field._id)
                .then((items) => {
                    scope.relatedItems = items;
                    scope.loading = false;
                });
            });
        },
    };
}
