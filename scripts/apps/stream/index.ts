import {StreamController} from './controllers';
import {ActivityMessageService} from './services';
import {ActivityStream, ActivityMessage} from './directives';

export default angular.module('superdesk.apps.stream', [
    'superdesk.core.activity',
    'superdesk.core.services.asset',
])
    .controller('StreamController', StreamController)

    .service('sdActivityMessage', ActivityMessageService)
    .directive('sdActivityStream', ActivityStream)
    .directive('sdActivityMessage', ActivityMessage)

    .config(['superdeskProvider', 'assetProvider', 'gettext', function(superdesk, asset, gettext) {
        superdesk.activity('/workspace/stream', {
            label: gettext('Workspace'),
            controller: 'StreamController',
            beta: true,
            templateUrl: asset.templateUrl('apps/stream/views/workspace-stream.html'),
            topTemplateUrl: asset.templateUrl('apps/dashboard/views/workspace-topnav.html'),
        });
    }]);
