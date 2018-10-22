import {coreMenuGroups} from 'core/activity/activity';

SettingsView.$inject = ['$route', 'superdesk', 'pageTitle', 'gettext'];
export function SettingsView($route, superdesk, pageTitle, gettext) {
    return {
        scope: {},
        transclude: true,
        templateUrl: 'scripts/apps/settings/views/settings-view.html',
        link: function(scope, elem, attrs) {
            superdesk.getMenu(superdesk.MENU_SETTINGS).then((menu) => {
                const menuItemsByGroup = menu.reduce((accumulator, item) => {
                    if (item.hasOwnProperty('settings_menu_group') === false) {
                        throw new Error('Settings items must have a group');
                    }
                    if (Array.isArray(accumulator[item.settings_menu_group.id]) !== true) {
                        accumulator[item.settings_menu_group.id] = [];
                    }
                    accumulator[item.settings_menu_group.id].push(item);

                    return accumulator;
                }, {});

                var mixedMenuItems = [];

                for (const key in menuItemsByGroup) {
                    menuItemsByGroup[key] = menuItemsByGroup[key].sort((a, b) => b.priority - a.priority);

                    mixedMenuItems.push({label: coreMenuGroups[key].getLabel(gettext), isGroupLabel: true});

                    menuItemsByGroup[key].forEach((item) => {
                        mixedMenuItems.push(item);
                    });
                }

                scope.mixedMenuItems = mixedMenuItems;

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
