import {startApp} from 'superdesk-core/scripts/index';

setTimeout(() => {
    startApp(
        [
            {
                id: 'availability-manager',
                load: () => import('superdesk-core/scripts/extensions/availability-manager'),
            },
            {
                id: 'content-lists',
                load: () => import('superdesk-core/scripts/extensions/content-lists'),
            },
            {
                id: 'publishing-sections',
                load: () => import('./test-extensions/publishing-sections'),
            },
        ],
        {}
    );
});

export default angular.module('main.superdesk', []);