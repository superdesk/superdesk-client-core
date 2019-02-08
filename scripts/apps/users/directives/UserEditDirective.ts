import {gettext} from 'core/utils';

UserEditDirective.$inject = ['api', 'notify', 'usersService', 'userList', 'session', 'lodash',
    'langmap', '$location', '$route', 'superdesk', 'features', 'asset', 'privileges',
    'desks', 'keyboardManager', 'gettextCatalog', 'config', 'metadata', 'deployConfig', 'modal'];
export function UserEditDirective(api, notify, usersService, userList, session, _,
    langmap, $location, $route, superdesk, features, asset, privileges, desks, keyboardManager,
    gettextCatalog, config, metadata, deployConfig, modal) {
    return {
        templateUrl: asset.templateUrl('apps/users/views/edit-form.html'),
        scope: {
            origUser: '=user',
            onsave: '&',
            oncancel: '&',
            onupdate: '&',
        },
        link: function(scope, elem) {
            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
            });
            scope.privileges = privileges.privileges;
            scope.features = features;
            scope.usernamePattern = usersService.usernamePattern;
            scope.twitterPattern = usersService.twitterPattern;
            scope.phonePattern = usersService.phonePattern;
            scope.signOffPattern = usersService.signOffPattern;
            scope.hideSignOff = config.user && config.user.sign_off_mapping;

            scope.dirty = false;
            scope.errorMessage = null;

            scope.xmppEnabled = deployConfig.getSync('xmpp_auth');

            scope.$watch('origUser', () => {
                scope.user = _.create(scope.origUser);
                if (scope.user.is_author === undefined) {
                    scope.user.is_author = true;
                }
            });

            resetUser(scope.origUser);

            scope.isNetworkSubscription = () =>
                ['solo', 'team'].indexOf(config.subscriptionLevel) === -1;

            scope.$watchCollection('user', (user) => {
                _.each(user, (value, key) => {
                    if (value === '') {
                        if (key !== 'phone' || key !== 'byline') {
                            user[key] = null;
                        } else {
                            delete user[key];
                        }
                    }
                });
                scope.dirty = !angular.equals(user, scope.origUser);
            });

            api('roles').query()
                .then((result) => {
                    scope.roles = result._items;
                });
            // get available translation languages
            var noBaseLanguage = true;

            scope.languages = config.profileLanguages.map((lang) => {
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
                resetUser(scope.origUser);
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
                if (scope.userForm[field]) {
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
                        return usersService.save(scope.origUser, scope.user)
                            .then((response) => {
                                scope.origUser = response;
                                resetUser(scope.origUser);
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
                    resetUser(scope.origUser);
                    scope.onupdate({user: scope.origUser});
                });
            };

            function resetUser(user) {
                scope.dirty = false;
                if (angular.isDefined(user._id)) {
                    return userList.getUser(user._id, true).then((u) => {
                        scope.error = null;
                        scope.origUser = u;
                        scope.user = _.create(u);
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
                }
            }

            scope.$on('user:updated', (event, user) => {
                resetUser(user);
            });

            scope.profileConfig = _.get(config, 'profile', {});
        },
    };
}
