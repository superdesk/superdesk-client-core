import {MultiImageEditController} from "apps/search/services/MultiImageEditService";

MultiImageEdit.$inject = ['asset'];
export function MultiImageEdit(asset) {
    return {
        scope: {
            images: '=',
            isUpload: '=',
            saveHandler: '=',
            closeHandler: '=',
            hideEditPane: '=',
            getImageUrl: '=',
            getProgress: '=',
            onRemoveItem: '=',
            uploadInProgress: '=',
            validator: '=',
        },
        transclude: {
            'additional-content': '?sdMultiEditAdditionalContent',
        },
        controller: MultiImageEditController,
        templateUrl: asset.templateUrl('apps/search/views/multi-image-edit.html'),
        link: function(scope) {
            scope.handleItemClick = function(event, image) {
                if (event.target != null && event.target.classList.contains("icon-close-small")) {
                    scope.onRemoveItem(image);
                } else {
                    scope.selectImage(image);
                }
            };
        },
    };
}
