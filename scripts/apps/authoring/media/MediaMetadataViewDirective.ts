import {appConfig} from 'appConfig';

MediaMetadataViewDirective.$inject = [];
export default function MediaMetadataViewDirective() {
    return {
        scope: {
            item: '=',
            showAltText: '@',
        },
        template: require('./views/media-metadata-view-directive.html'),
        link: (scope) => {
            scope.validator = appConfig.validator_media_metadata;
        },
    };
}
