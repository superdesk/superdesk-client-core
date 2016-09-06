SettingsView.$inject = ['$route', 'superdesk'];
export function SettingsView($route, superdesk) {
    return {
        scope: {},
        transclude: true,
        templateUrl: 'scripts/superdesk-settings/views/settings-view.html',
        link: function(scope, elem, attrs) {
            superdesk.getMenu(superdesk.MENU_SETTINGS).then(function(menu) {
                scope.settings = menu;
            });

            scope.currentRoute = $route.current;
        }
    };
}
