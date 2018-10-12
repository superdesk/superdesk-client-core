MediaMetadataViewDirective.$inject = ['deployConfig'];
export default function MediaMetadataViewDirective(deployConfig) {
    return {
        scope: {
            item: '=',
            showAltText: '@',
        },
        template: require('./views/media-metadata-view-directive.html'),
        link: (scope) => {
            scope.validator = deployConfig.getSync('validator_media_metadata');
        },
    };
}
