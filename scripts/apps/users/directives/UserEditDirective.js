UserEditDirective.$inject = ['api', 'gettext', 'notify', 'usersService', 'userList', 'session', 'lodash',
    'langmap', '$location', '$route', 'superdesk', 'features', 'asset', 'privileges',
    'desks', 'keyboardManager', 'gettextCatalog', 'config'];
export function UserEditDirective(api, gettext, notify, usersService, userList, session, _, langmap, $location, $route, superdesk, features,
    asset, privileges, desks, keyboardManager, gettextCatalog, config) {
    return {
        templateUrl: asset.templateUrl('apps/users/views/edit-form.html'),
        scope: {
            origUser: '=user',
            onsave: '&',
            oncancel: '&',
            onupdate: '&'
        },
        link: function(scope, elem) {
            scope.privileges = privileges.privileges;
            scope.features = features;
            scope.usernamePattern = usersService.usernamePattern;
            scope.phonePattern = usersService.phonePattern;
            scope.signOffPattern = usersService.signOffPattern;
            scope.hideSignOff = config.user && config.user.sign_off_mapping ? true: false;

            scope.dirty = false;
            scope.errorMessage = null;

            scope.$watch('origUser', function() {
                scope.user = _.create(scope.origUser);
            });

            resetUser(scope.origUser);

            scope.$watchCollection('user', function(user) {
                _.each(user, function(value, key) {
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

            api('roles').query().then(function(result) {
                scope.roles = result._items;
            });
            //get available translation languages
            var noBaseLanguage = true;
            scope.languages = _.map(gettextCatalog.strings, function(translation, lang) {
                if (lang === gettextCatalog.baseLanguage) {
                    noBaseLanguage = false;
                }
                var lang_code = lang.replace('_', '-');
                if (langmap[lang_code]) {
                    return {'code': lang, 'nativeName': langmap[lang_code].nativeName};
                }
            });

            //add baseLanguage if needed
            if (noBaseLanguage) {
                scope.languages.unshift(
                    {'code': gettextCatalog.baseLanguage, 'nativeName': langmap[gettextCatalog.baseLanguage].nativeName});
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
                superdesk.intent('edit', 'avatar', scope.user).then(function(avatar) {
                    scope.user.picture_url = avatar; // prevent replacing Avatar which would get into diff
                });
            };

            scope.save = function() {
                scope.error = null;
                notify.info(gettext('Saving...'));
                return usersService.save(scope.origUser, scope.user)
                .then(function(response) {
                    scope.origUser = response;
                    resetUser(scope.origUser);
                    notify.pop();
                    notify.success(gettext('user saved.'));
                    scope.onsave({user: scope.origUser});

                    if (scope.user._id === session.identity._id) {
                        session.updateIdentity(scope.origUser);
                    }

                    userList.clearCache();

                }, function(response) {
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
                                errorMessage = gettext('Error: ' + response.data._issues['validator exception']);
                            }

                            scope.error = response.data._issues;
                            scope.error.message = errorMessage;

                            for (var field in response.data._issues) {
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
                        }

                        notify.error(errorMessage);
                    }
                });
            };

            scope.toggleStatus = function(active) {
                usersService.toggleStatus(scope.origUser, active).then(function() {
                    resetUser(scope.origUser);
                    scope.onupdate({user: scope.origUser});
                });
            };

            function resetUser(user) {
                scope.dirty = false;
                if (angular.isDefined(user._id)) {
                    return userList.getUser(user._id, true).then(function(u) {
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
                            desks.fetchUserDesks(u).then(function(response) {
                                scope.userDesks = response._items;
                            });
                        }
                    });
                }
            }

            scope.$on('user:updated', function(event, user) {
                resetUser(user);
            });
        }
    };
}
