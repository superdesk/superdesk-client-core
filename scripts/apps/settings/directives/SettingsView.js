SettingsView.$inject = ['$route', 'superdesk', 'pageTitle'];
export function SettingsView($route, superdesk, pageTitle) {
    return {
        scope: {},
        transclude: true,
        templateUrl: 'scripts/apps/settings/views/settings-view.html',
        link: function(scope, elem, attrs) {
            superdesk.getMenu(superdesk.MENU_SETTINGS).then(function(menu) {
                scope.settings = menu;
            });

            scope.currentRoute = $route.current;
            pageTitle.setPageUrl(_.capitalize(gettext('Settings')));
            if (scope.currentRoute.$$route.label !== 'Settings') {
                pageTitle.setPageWorkspace(_.capitalize(gettext(scope.currentRoute.$$route.label)));
            } else {
                pageTitle.setPageWorkspace(null);
            }
        }
    };
}
