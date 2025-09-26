import {startApp} from 'superdesk-core/scripts/index';

setTimeout(() => {
    // `icon-` allows superdesk icon font
    // `.pi` allows prime react icon font

    const styles = `
    *:not([class^="icon-"], [class*="big-icon--"], [class*="filetype-icon-"], .pi) {
        font-family: Arial!important;
    }

    * {
        -webkit-font-smoothing: none !important;
        font-variant-ligatures: none !important;
        font-feature-settings: 'liga' 0 !important;
        font-kerning: none !important;
        text-rendering: optimizespeed !important;
    }
  `;

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