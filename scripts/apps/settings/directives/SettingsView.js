SettingsView.$inject = ['$route', 'superdesk', 'pageTitle'];
export function SettingsView($route, superdesk, pageTitle) {
    return {
        scope: {},
        transclude: true,
        templateUrl: 'scripts/apps/settings/views/settings-view.html',
        link: function(scope, elem, attrs) {
            superdesk.getMenu(superdesk.MENU_SETTINGS).then((menu) => {
                scope.settings = menu;
            });

            scope.currentRoute = $route.current;
            pageTitle.setUrl(_.capitalize(gettext('Settings')));
            if (scope.currentRoute.$$route.label !== 'Settings') {
                pageTitle.setWorkspace(_.capitalize(gettext(scope.currentRoute.$$route.label)));
            } else {
                pageTitle.setWorkspace(null);
            }
        },
    };
}
