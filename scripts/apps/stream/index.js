import { StreamController } from './controllers';
import { ActivityStream, ActivityMessage } from './directives';

export default angular.module('superdesk.stream', [
    'superdesk.activity',
    'superdesk.asset'
])
    .controller('StreamController', StreamController)

    .directive('sdActivityStream', ActivityStream)
    .directive('sdActivityMessage', ActivityMessage)

    .config(['superdeskProvider', 'assetProvider', 'gettext', function(superdesk, asset, gettext) {
        superdesk.activity('/workspace/stream', {
            label: gettext('Workspace'),
            controller: 'StreamController',
            beta: true,
            templateUrl: asset.templateUrl('apps/stream/views/workspace-stream.html'),
            topTemplateUrl: asset.templateUrl('apps/dashboard/views/workspace-topnav.html')
        });
    }]);
