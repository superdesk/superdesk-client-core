import MediaMetadataEditorDirective from './MediaMetadataEditorDirective';

export default angular.module('superdesk.apps.authoring.media', [])
    .directive('sdMediaMetadataEditor', MediaMetadataEditorDirective)
;