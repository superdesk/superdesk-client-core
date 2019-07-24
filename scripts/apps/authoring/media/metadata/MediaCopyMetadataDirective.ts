MediaCopyMetadataDirective.$inject = [];
export default function MediaCopyMetadataDirective() {
    return {
        scope: {
            metadata: '=',
            onChange: '&',
        },
        template: require('../views/media-copy-metadata-directive.html'),
        link: (scope) => {
            const METADATA_ITEMS = 'metadata:items';

            scope.metadataFromStorage = !!localStorage.getItem(METADATA_ITEMS);

            scope.copyMetadata = (metadata) => {
                scope.metadataFromStorage = true;
                localStorage.setItem(METADATA_ITEMS, JSON.stringify(metadata));
            };

            scope.pasteMetadata = () => {
                scope.metadata = JSON.parse(localStorage.getItem(METADATA_ITEMS));
                scope.onChange();
            };

            scope.clearSavedMetadata = () => {
                localStorage.removeItem(METADATA_ITEMS);
                scope.metadataFromStorage = false;
            };
        },
    };
}
