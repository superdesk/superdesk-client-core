import {IArticle} from 'superdesk-api';
import {dispatchCustomEvent} from 'core/get-superdesk-api-implementation';

let itemInPreviewMode: IArticle | null = null;

export function ItemPreviewContainer() {
    return {
        template: '<div ng-if="item" sd-media-view data-item="item" data-close="close()"></div>',
        scope: {},
        link: function(scope) {
            scope.item = null;

            scope.$on('intent:preview:item', (event, intent) => {
                if (itemInPreviewMode != null) {
                    dispatchCustomEvent('articlePreviewEnd', itemInPreviewMode);

                    itemInPreviewMode = null;
                }

                if (intent.data != null) {
                    itemInPreviewMode = intent.data;

                    dispatchCustomEvent('articlePreviewStart', itemInPreviewMode);
                }

                scope.item = intent.data;
            });

            /**
             * Close lightbox
             */
            scope.close = function() {
                scope.item = null;

                if (itemInPreviewMode != null) {
                    dispatchCustomEvent('articlePreviewEnd', itemInPreviewMode);

                    itemInPreviewMode = null;
                }
            };
        },
    };
}
