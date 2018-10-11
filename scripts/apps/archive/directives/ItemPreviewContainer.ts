export function ItemPreviewContainer() {
    return {
        template: '<div ng-if="item" sd-media-view data-item="item" data-close="close()"></div>',
        scope: {},
        link: function(scope) {
            scope.item = null;

            scope.$on('intent:preview:item', (event, intent) => {
                scope.item = intent.data;
            });

            /**
             * Close lightbox
             */
            scope.close = function() {
                scope.item = null;
            };
        },
    };
}
