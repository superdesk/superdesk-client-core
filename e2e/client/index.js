import {startApp} from 'superdesk-core/scripts/index';

setTimeout(() => {
    const styles = 'body {font-family: Arial!important}';

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;

    // Use Arial font in tests.
    // With Roboto screenshots don't match when generated using vscode extension vs headless run
    document.head.appendChild(styleSheet);

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