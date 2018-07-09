MediaMetadataEditorDirective.$inject = ['metadata'];
export default function MediaMetadataEditorDirective(metadata) {
    return {
        scope: {
            item: '=',
            validator: '=',
            placeholder: '=',
            disabled: '=',
            onChange: '&',
            onBlur: '&',
            dark: '@',
            boxed: '@',
            associated: '=',
        },
        template: require('./views/media-metadata-editor-directive.html'),
        link: (scope) => {
            // pass
        },
    };
}