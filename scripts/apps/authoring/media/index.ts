import MediaMetadataEditorDirective from './MediaMetadataEditorDirective';
import MediaMetadataViewDirective from './MediaMetadataViewDirective';
import MediaCopyMetadataDirective from './MediaCopyMetadataDirective';

export default angular.module('superdesk.apps.authoring.media', [])
    .directive('sdMediaMetadataEditor', MediaMetadataEditorDirective)
    .directive('sdMediaMetadataView', MediaMetadataViewDirective)
    .directive('sdMediaCopyMetadata', MediaCopyMetadataDirective)
;
