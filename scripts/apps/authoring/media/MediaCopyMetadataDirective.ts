import { keys, pick, merge } from 'lodash';

MediaCopyMetadataDirective.$inject = [];
export default function MediaCopyMetadataDirective() {
    return {
        scope: {
            metadata: '=',
            validator: '=',
            onChange: '&',
        },
        template: require('./views/media-copy-metadata-directive.html'),
        link: (scope) => {
            const METADATA_ITEMS = 'metadata:items';
            const FIELD_KEYS = keys(scope.validator);

            scope.metadataFromStorage = !!localStorage.getItem(METADATA_ITEMS);

            scope.copyMetadata = (metadata) => {
                scope.metadataFromStorage = true;
                localStorage.setItem(METADATA_ITEMS, JSON.stringify(pick(metadata, FIELD_KEYS)));
            };

            scope.pasteMetadata = () => {
                const metadataFromStorage = JSON.parse(localStorage.getItem(METADATA_ITEMS));
                scope.metadata = merge(scope.metadata, metadataFromStorage);
                scope.onChange();
            };

            scope.clearSavedMetadata = () => {
                localStorage.removeItem(METADATA_ITEMS);
                scope.metadataFromStorage = false;
            };
        },
    };
}
