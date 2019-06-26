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

RelatedItemsPreview.$inject = ['relationsService'];

export function RelatedItemsPreview(relationsService) {
    return {
        scope: {
            item: '=',
            field: '<',
        },
        template: require('../views/related-items-preview.html'),
        link: function(scope) {
            scope.loading = true;
            relationsService.getRelatedItemsForField(scope.item, scope.field._id)
                .then((items) => {
                    scope.relatedItems = items;
                    scope.loading = false;
                });
        },
    };
}
