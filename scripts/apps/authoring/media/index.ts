import MediaMetadataEditorDirective from './metadata/MediaMetadataEditorDirective';
import MediaMetadataViewDirective from './metadata/MediaMetadataViewDirective';
import MediaCopyMetadataDirective from './metadata/MediaCopyMetadataDirective';

export default angular.module('superdesk.apps.authoring.media', [])
    .directive('sdMediaMetadataEditor', MediaMetadataEditorDirective)
    .directive('sdMediaMetadataView', MediaMetadataViewDirective)
    .directive('sdMediaCopyMetadata', MediaCopyMetadataDirective)
;
