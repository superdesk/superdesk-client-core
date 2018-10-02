/**
 * @ngdoc directive
 * @module superdesk.apps.archive
 * @name sdItemCrops
 *
 * @requires metadata
 *
 * @description
 *   This directive is responsible for displaying custom crops in authoring
 *   below feature media and editor for media item.
 */

ItemCrops.$inject = ['metadata'];

export function ItemCrops(metadata) {
    return {
        templateUrl: 'scripts/apps/archive/views/item-crops.html',
        scope: {
            item: '=',
        },
        link: function(scope, elem) {
            metadata.initialize().then(() => {
                scope.crop_sizes = metadata.values.crop_sizes;
            });

            /**
             * @ngdoc method
             * @name sdItemCrops#showCrops
             *
             * @description Checks if item has crops
             */
            scope.showCrops = () => (
                _.includes(['picture', 'graphic'], scope.item.type) && _.get(metadata, 'values.crop_sizes') &&
                metadata.values.crop_sizes.some(
                    (crop) => scope.item.renditions && scope.item.renditions[crop.name]
                )
            );
        },
    };
}
