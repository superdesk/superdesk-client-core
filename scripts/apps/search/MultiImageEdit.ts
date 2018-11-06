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
        },
        transclude: {
            'additional-content': '?sdMultiEditAdditionalContent',
        },
        controller: MultiImageEditController,
        templateUrl: asset.templateUrl('apps/search/views/multi-image-edit.html'),
    };
}
