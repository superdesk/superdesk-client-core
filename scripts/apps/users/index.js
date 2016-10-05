// styles
import './activity-widget/widget-activity.less';
import './styles/change-avatar.less';
import './styles/settings.less';
import './styles/users.less';

import './activity-widget/activity';
import './import/import';

import { UserEditController } from './controllers';
import * as svc from './services';
import * as directive from './directives';
import * as config from './config';

export default angular.module('superdesk.apps.users', [
    'superdesk.activity',
    'superdesk.asset'
])
    .controller('UserEditController', UserEditController) // make it available to user.profile

    .service('usersService', svc.UsersService)
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

    .filter('username', () => user => user ?
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
                _.each(scope.$eval(attrs.data), function(value, key) {
                    nscope[key] = value;
                });
                $compile(element.contents())(nscope);
            };
        }]);
    }])

    .run(config.KeyboardShortcuts);

angular.module('superdesk.apps.users.profile', ['superdesk.api', 'superdesk.apps.users'])
    .directive('sdUserActivity', directive.UserActivityDirective)
    .service('profileService', svc.ProfileService)
    .config(['superdeskProvider', 'assetProvider', function(superdeskProvider, asset) {
        superdeskProvider.activity('/profile/', {
            label: gettext('My Profile'),
            controller: UserEditController,
            templateUrl: asset.templateUrl('apps/users/views/edit.html'),
            resolve: {
                user: ['session', 'api', function(session, api) {
                    return session.getIdentity().then(function(identity) {
                        return api.get(identity._links.self.href);
                    });
                }]
            }
        });
    }]);
