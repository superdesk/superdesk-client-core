import {startApp} from 'superdesk-core/scripts/index';

setTimeout(() => {
    startApp(
        [
            {
                id: 'availability-manager',
                load: () => import('superdesk-core/scripts/extensions/availability-manager'),
            },
        ],
        {}
    );
});

export default angular.module('main.superdesk', []);