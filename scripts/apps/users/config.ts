import {
    UserEditController,
    UserListController,
    ChangeAvatarController,
    UserEnableCommand,
    UserDeleteCommand,
    UserResolver,
    UserRolesController,
    SessionsDeleteCommand,
} from './controllers';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/ui/components/utils';

API.$inject = ['apiProvider'];
export function API(apiProvider) {
    apiProvider.api('users', {
        type: 'http',
        backend: {rel: 'users'},
    });
    apiProvider.api('roles', {
        type: 'http',
        backend: {rel: 'roles'},
    });
    apiProvider.api('resetPassword', {
        type: 'http',
        backend: {rel: 'reset_user_password'},
    });
    apiProvider.api('changePassword', {
        type: 'http',
        backend: {rel: 'change_user_password'},
    });
}

Activities.$inject = ['superdeskProvider', 'assetProvider'];
export function Activities(superdesk, asset) {
    superdesk
        .activity('/users/', {
            label: gettext('User management'),
            description: gettext('Find your colleagues'),
            controller: UserListController,
            templateUrl: asset.templateUrl('apps/users/views/list.html'),
            category: superdesk.MENU_MAIN,
            adminTools: true,
            reloadOnSearch: false,
            filters: [
                {
                    action: superdesk.ACTION_PREVIEW,
                    type: 'user',
                },
                {action: 'list', type: 'user'},
            ],
            privileges: {users: 1},
        })

        .activity('/users/:_id', {
            label: gettext('Users Profile'),
            priority: 100,
            controller: UserEditController,
            templateUrl: asset.templateUrl('apps/users/views/edit.html'),
            resolve: {user: UserResolver},
            filters: [{action: 'detail', type: 'user'}],
            privileges: {users: 1},
        })

        .activity('/settings/user-roles', {
            label: gettext('User Roles'),
            templateUrl: asset.templateUrl('apps/users/views/settings.html'),
            controller: UserRolesController,
            category: superdesk.MENU_SETTINGS,
            settings_menu_group: coreMenuGroups.WORKFLOW,
            priority: -500,
            privileges: {roles: 1},
        })

        .activity('delete/user', {
            label: gettext('Disable user'),
            icon: 'trash',
            confirm: gettext('Please confirm that you want to disable a user.'),
            controller: UserDeleteCommand,
            filters: [
                {
                    action: superdesk.ACTION_EDIT,
                    type: 'user',
                },
            ],
            condition: function(data) {
                return data.is_enabled;
            },
            privileges: {users: 1},
        })

        .activity('clear/sessions', {
            label: gettext('Clear sessions'),
            icon: 'kill',
            confirm: gettext('Please confirm that you want to delete all the sessions for this user.'),
            controller: SessionsDeleteCommand,
            filters: [
                {
                    action: superdesk.ACTION_EDIT,
                    type: 'user',
                },
            ],
            condition: (data) => data.is_enabled,
            privileges: {users: 1},
        })

        .activity('restore/user', {
            label: gettext('Enable user'),
            icon: 'revert',
            controller: UserEnableCommand,
            filters: [
                {
                    action: superdesk.ACTION_EDIT,
                    type: 'user',
                },
            ],
            condition: (data) => !data.is_enabled,
            privileges: {users: 1},
        })

        .activity('edit.avatar', {
            label: gettext('Change avatar'),
            modal: true,
            cssClass: 'upload-avatar modal--large modal--z-index-fix',
            controller: ChangeAvatarController,
            templateUrl: asset.templateUrl('apps/users/views/change-avatar.html'),
            filters: [{action: 'edit', type: 'avatar'}],
        });
}

Permissions.$inject = ['superdeskProvider'];
export function Permissions(superdesk) {
    superdesk
        .permission('users-manage', {
            label: gettext('Manage users'),
            permissions: {users: {write: true}},
        })

        .permission('users-read', {
            label: gettext('Read users'),
            permissions: {users: {read: true}},
        })

        .permission('user-roles-manage', {
            label: gettext('Manage user roles'),
            permissions: {user_roles: {write: true}},
        })

        .permission('user-roles-read', {
            label: gettext('Read user roles'),
            permissions: {user_roles: {read: true}},
        });
}

export var KeyboardShortcuts = ['keyboardManager',
    function(keyboardManager) {
        keyboardManager.register('Users', 'Up', gettext('Previous user'));
        keyboardManager.register('Users', 'Down', gettext('Next user'));
    },
];
