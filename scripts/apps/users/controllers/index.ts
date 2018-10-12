export {UserEditController} from './UserEditController';
export {UserListController} from './UserListController';
export {ChangeAvatarController} from './ChangeAvatarController';
export {UserEnableCommand} from './UserEnableCommand';
export {UserDeleteCommand} from './UserDeleteCommand';
export {SessionsDeleteCommand} from './SessionsDeleteCommand';
export {UserResolver} from './UserResolver';

// TODO: is this needed?
UserRolesController.$inject = ['$scope'];
export function UserRolesController($scope) { /* no-op */ }
