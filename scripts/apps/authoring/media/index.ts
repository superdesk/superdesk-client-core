import MediaMetadataEditorDirective from './MediaMetadataEditorDirective';
import MediaCopyMetadataDirective from './MediaCopyMetadataDirective';
import MediaFieldsController from './media-fields-controller';

import {reactToAngular1} from 'superdesk-ui-framework';
import {MediaMetadataView} from './MediaMetadataView';

export default angular.module('superdesk.apps.authoring.media', [])
    .directive('sdMediaMetadataEditor', MediaMetadataEditorDirective)
    .component('sdMediaMetadataView', reactToAngular1(MediaMetadataView, ['item', 'showAltText', 'className']))
    .directive('sdMediaCopyMetadata', MediaCopyMetadataDirective)
    .controller('MediaFieldsController', MediaFieldsController)
;
