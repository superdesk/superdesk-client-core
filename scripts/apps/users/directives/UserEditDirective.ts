import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {applyDefault} from 'core/helpers/typescript-helpers';
import {CC} from 'core/ui/configurable-ui-components';
import {generate} from 'json-merge-patch';
import {noop} from 'lodash';

UserEditDirective.$inject = ['api', 'notify', 'usersService', 'userList', 'session', 'lodash',
    'langmap', '$location', '$route', 'superdesk', 'features', 'asset', 'privileges',
    'desks', 'keyboardManager', 'gettextCatalog', 'metadata', 'modal', '$q'];
export function UserEditDirective(api, notify, usersService, userList, session, _,
    langmap, $location, $route, superdesk, features, asset, privileges, desks, keyboardManager,
    gettextCatalog, metadata, modal, $q) {
    return {
        templateUrl: asset.templateUrl('apps/users/views/edit-form.html'),
        scope: {
            origUser: '=user',
            onsave: '&',
            oncancel: '&',
            onupdate: '&',
        },
        link: function(scope, elem) {
            // origUser is set by parent scope when selecting users from GUI
            // but it also needs to be updated before editing so dirtiness can be computed correctly
            // according to the latest data on the server
            let clearOrigUserWatcher = noop;

            // only initialize after selecting a user for editing/creation
            // having it running when switcing between users can cause fields to be modified
            // or produce an incorrect dirtiness value
            let clearUserWatcher = noop;

            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
            });
            scope.privileges = privileges.privileges;
            scope.features = features;
            scope.usernamePattern = appConfig.user?.username_pattern != null ?
                new RegExp(appConfig.user.username_pattern) : usersService.usernamePattern;
            scope.twitterPattern = usersService.twitterPattern;
            scope.phonePattern = usersService.phonePattern;
            scope.signOffPattern = usersService.signOffPattern;
            scope.hideSignOff = appConfig.user != null && appConfig.user.sign_off_mapping;

            // disallow changing an avatar if custom avatars are configured for the instance
            scope.canChangeAvatar = CC.UserAvatar == null;

            scope.dirty = false;
            scope.errorMessage = null;

            // hiding the edit form until user hasn't loaded
            // not doing so causes issues when switching users quickly
            // UserUniqueDirective was computing results based on data of a previously selected user
            scope.loading = true;

            scope.xmppEnabled = appConfig.xmpp_auth;

            resetUser();

            // user avatar component expects immutable data and won't update if object reference hasn't changed
            scope.userImmutable = {};

            scope.isNetworkSubscription = () =>
                ['solo', 'team'].indexOf(appConfig.subscriptionLevel) === -1;

            api('roles').query()
                .then((result) => {
                    scope.roles = result._items;
                });
            // get available translation languages
            var noBaseLanguage = true;

            scope.languages = appConfig.profileLanguages.map((lang) => {
                if (lang === gettextCatalog.baseLanguage) {
                    noBaseLanguage = false;
                }

                const langCode = lang.replace('_', '-');

                if (langmap[langCode]) {
                    return {code: lang, nativeName: langmap[langCode].nativeName};
                }

                return {code: lang, nativeName: lang};
            });

            // add baseLanguage if needed
            if (noBaseLanguage) {
                scope.languages.unshift({
                    code: gettextCatalog.baseLanguage,
                    nativeName: langmap[gettextCatalog.baseLanguage].nativeName,
                });
            }

            scope.cancel = function() {
                resetUser();
                if (!scope.origUser.Id) {
                    scope.oncancel();
                }
            };
            scope.focused = function() {
                keyboardManager.unbind('down');
                keyboardManager.unbind('up');
            };

            scope.editPicture = function() {
                superdesk.intent('edit', 'avatar', scope.user).then((avatar) => {
                    scope.user.picture_url = avatar; // prevent replacing Avatar which would get into diff
                });
            };

            function validateField(response, field) {
                if (scope.userForm?.[field]) {
                    if (scope.error[field]) {
                        scope.error.message = null;
                    }
                    for (var constraint in response.data._issues[field]) {
                        if (response.data._issues[field][constraint]) {
                            scope.userForm[field].$setValidity(constraint, false);
                            scope.error.message = null;
                        }
                    }
                }
            }

            scope.save = function() {
                new Promise((resolve) => {
                    if (
                        scope.user._id !== session.identity._id // changing language for another user
                        || scope.user.language === scope.origUser.language
                    ) {
                        resolve(false);
                    } else {
                        modal.confirm(
                            gettext('Do you want to reload the page now?'),
                            gettext('The page needs to be reloaded to change the language'),
                        )
                            .then(() => {
                                resolve(true);
                            });
                    }
                })
                    .then((reloadPage) => {
                        scope.error = null;
                        notify.info(gettext('Saving...'));
                        return usersService.save(scope.origUser, generate(scope.origUser, scope.user))
                            .then((response) => {
                                scope.origUser = response;
                                resetUser();
                                notify.pop();
                                notify.success(gettext('user saved.'));
                                scope.onsave({user: scope.origUser});

                                if (scope.user._id === session.identity._id) {
                                    session.updateIdentity(scope.origUser);
                                }

                                userList.clearCache();

                                if (reloadPage === true) {
                                    window.location.reload();
                                }
                            }, (response) => {
                                notify.pop();
                                if (response.status === 404) {
                                    if ($location.path() === '/users/') {
                                        $route.reload();
                                    } else {
                                        $location.path('/users/');
                                    }
                                    notify.error(gettext('User was not found. The account might have been deleted.'));
                                } else {
                                    var errorMessage = gettext('There was an error when saving the user account. ');

                                    if (response.data && response.data._issues) {
                                        if (angular.isDefined(response.data._issues['validator exception'])) {
                                            errorMessage = gettext(
                                                'Error: {{error}}',
                                                {error: response.data._issues['validator exception']},
                                            );
                                        }

                                        scope.error = response.data._issues;
                                        scope.error.message = errorMessage;

                                        for (var field in response.data._issues) {
                                            validateField(response, field);
                                        }
                                    }

                                    notify.error(errorMessage);
                                }
                            });
                    });
            };

            scope.toggleStatus = function(active) {
                usersService.toggleStatus(scope.origUser, active).then(() => {
                    resetUser();
                    scope.onupdate({user: scope.origUser});
                });
            };

            function resetUser() {
                clearOrigUserWatcher();
                clearUserWatcher();

                scope.dirty = false;
                scope.loading = true;

                return $q.when()
                    .then(() => {
                        const user = scope.origUser;

                        if (angular.isDefined(user._id)) {
                            return userList.getUser(user._id, true)
                                .then((u) => {
                                    if (u.is_author === undefined) {
                                        u.user.is_author = true;
                                    }

                                    scope.error = null;
                                    scope.origUser = u;
                                    scope.user = Object.assign({}, u);
                                    scope.confirm = {password: null};
                                    scope.show = {password: false};
                                    scope._active = usersService.isActive(u);
                                    scope._pending = usersService.isPending(u);
                                    scope.profile = scope.user._id === session.identity._id;
                                    scope.userDesks = [];
                                    if (angular.isDefined(u) && angular.isDefined(u._links)) {
                                        desks.fetchUserDesks(u).then((response) => {
                                            scope.userDesks = response;
                                        });
                                    }
                                });
                        } else {
                            scope.user = {};

                            return $q.when();
                        }
                    })
                    .then(() => {
                        clearOrigUserWatcher = scope.$watch('origUser', (newVal, oldVal) => {
                            if (newVal !== oldVal) {
                                resetUser();
                            }
                        });

                        let userWatchInitialized = false;

                        clearUserWatcher = scope.$watchCollection('user', (user) => {
                            // avoid incorrect dirty check when user is undefined and not initialized
                            if (userWatchInitialized) {
                                scope.userImmutable = {...user};

                                _.each(user, (value, key) => {
                                    if (scope.origUser[key] !== '' && value === '') {
                                        if (key !== 'phone' || key !== 'byline') {
                                            user[key] = null;
                                        } else {
                                            delete user[key];
                                        }
                                    }
                                });
                                scope.dirty = JSON.stringify(user) !== JSON.stringify(scope.origUser);
                            } else {
                                userWatchInitialized = true;
                            }
                        });

                        scope.loading = false;
                    });
            }

            scope.$on('user:updated', (event, user) => {
                scope.origUser = user;
                resetUser();
            });

            scope.profileConfig = applyDefault(appConfig.profile, {});
        },
    };
}
