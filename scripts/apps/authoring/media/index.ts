import MediaMetadataEditorDirective from './MediaMetadataEditorDirective';
import MediaMetadataViewDirective from './MediaMetadataViewDirective';

export default angular.module('superdesk.apps.authoring.media', [])
    .directive('sdMediaMetadataEditor', MediaMetadataEditorDirective)
    .directive('sdMediaMetadataView', MediaMetadataViewDirective)
;