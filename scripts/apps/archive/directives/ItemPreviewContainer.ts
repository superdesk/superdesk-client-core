import {IArticle} from 'superdesk-api';
import {getCustomEventNamePrefixed} from 'core/notification/notification';

let itemInPreviewMode: IArticle | null = null;

export function ItemPreviewContainer() {
    return {
        template: '<div ng-if="item" sd-media-view data-item="item" data-close="close()"></div>',
        scope: {},
        link: function(scope) {
            scope.item = null;

            scope.$on('intent:preview:item', (event, intent) => {
                if (itemInPreviewMode != null) {
                    window.dispatchEvent(
                        new CustomEvent(getCustomEventNamePrefixed('articlePreviewEnd'), {detail: itemInPreviewMode}),
                    );

                    itemInPreviewMode = null;
                }

                if (intent.data != null) {
                    itemInPreviewMode = intent.data;

                    window.dispatchEvent(
                        new CustomEvent(getCustomEventNamePrefixed('articlePreviewStart'), {detail: itemInPreviewMode}),
                    );
                }

                scope.item = intent.data;
            });

            /**
             * Close lightbox
             */
            scope.close = function() {
                scope.item = null;

                if (itemInPreviewMode != null) {
                    window.dispatchEvent(
                        new CustomEvent(getCustomEventNamePrefixed('articlePreviewEnd'), {detail: itemInPreviewMode}),
                    );

                    itemInPreviewMode = null;
                }
            };
        },
    };
}
