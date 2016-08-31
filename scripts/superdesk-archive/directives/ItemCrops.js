ItemCrops.$inject = ['metadata'];

export function ItemCrops(metadata) {
    return {
        templateUrl: 'scripts/superdesk-archive/views/item-crops.html',
        scope: {
            item: '='
        },
        link: function(scope, elem) {
            metadata.initialize().then(function() {
                scope.crop_sizes = metadata.values.crop_sizes;
            });
        }
    };
}
