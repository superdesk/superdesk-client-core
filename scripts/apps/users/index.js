// styles
import './activity-widget/widget-activity.scss';
import './styles/change-avatar.scss';
import './styles/settings.scss';
import './styles/users.scss';

import './activity-widget/activity';
import './import/import';
import RolesService from './roles/RolesService';

import {UserEditController} from './controllers';
import * as svc from './services';
import * as directive from './directives';
import * as config from './config';
import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc module
 * @module superdesk.apps.users
 * @name superdesk.apps.users
 * @packageName superdesk.apps
 * @description Superdesk user roles, privileges and profiles module.
 */
export default angular.module('superdesk.apps.users', [
    'superdesk.core.activity',
    'superdesk.core.services.asset',
])
    .controller('UserEditController', UserEditController) // make it available to user.profile

    .service('usersService', svc.UsersService)
    .service('roles', RolesService)
    .factory('userList', svc.UserListService)
    .factory('userPopup', svc.UserPopupService)

    .directive('sdUserRoles', directive.UserRolesDirective)
    .directive('sdRolesPrivileges', directive.RolesPrivilegesDirective)
    .directive('sdInfoItem', directive.InfoItemDirective)
    .directive('sdValidError', directive.ValidErrorDirective)
    .directive('sdValidInfo', directive.ValidInfoDirective)
    .directive('sdUserDetailsPane', directive.UserDetailsPaneDirective)
    .directive('sdUserEdit', directive.UserEditDirective)
    .directive('sdUserPreferences', directive.UserPreferencesDirective)
    .directive('sdUserPrivileges', directive.UserPrivilegesDirective)
    .directive('sdChangePassword', directive.ChangePasswordDirective)
    .directive('sdResetPassword', directive.ResetPasswordDirective)
    .directive('sdUserUnique', directive.UserUniqueDirective)
    .directive('sdPasswordConfirm', directive.PasswordConfirmDirective)
    .directive('sdUserList', directive.UserListDirective)
    .directive('sdUserListItem', directive.UserListItemDirective)
    .directive('sdActivity', directive.ActivityDirective)
    .directive('sdUserMentio', directive.UserMentioDirective)
    .directive('sdUserInfo', directive.UserInfoDirective)

    .filter('username', () => (user) => user ?
        user.display_name || user.username : null)

    .config(config.Permissions)
    .config(config.Activities)
    .config(config.API)

    .config(['$compileProvider', function($compileProvider) {
        // configure new 'compile' directive by passing a directive
        // factory function. The factory function injects the '$compile'
        $compileProvider.directive('compile', ['$compile', function($compile) {
            // directive factory creates a link function
            return function(scope, element, attrs) {
                var value = scope.$eval(attrs.compile);

                element.html(value);
                var nscope = scope.$new(true);

                _.each(scope.$eval(attrs.data), (value, key) => {
                    nscope[key] = value;
                });
                $compile(element.contents())(nscope);
            };
        }]);
    }])

    .run(config.KeyboardShortcuts);

angular.module('superdesk.apps.users.profile', ['superdesk.core.api', 'superdesk.apps.users'])
    .directive('sdUserActivity', directive.UserActivityDirective)
    .service('profileService', svc.ProfileService)
    .config(['superdeskProvider', 'assetProvider', function(superdeskProvider, asset) {
        superdeskProvider.activity('/profile/', {
            label: gettext('My Profile'),
            controller: UserEditController,
            templateUrl: asset.templateUrl('apps/users/views/edit.html'),
            resolve: {
                user: ['session', 'api', function(session, api) {
                    return session.getIdentity().then((identity) => api.get(identity._links.self.href));
                }],
            },
        });
    }]);
