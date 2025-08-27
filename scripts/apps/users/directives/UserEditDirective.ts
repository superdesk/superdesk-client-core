import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {applyDefault} from 'core/helpers/typescript-helpers';
import {CC} from 'core/ui/configurable-ui-components';
import {noop, omit} from 'lodash';
import {showConfirmationPrompt} from 'core/ui/show-confirmation-prompt';
import {IUser} from 'superdesk-api';
import {generate} from 'json-merge-patch';

interface IScope {
    origUser: IUser & {Id: string};
    onsave(params: {user: IUser}): void;
    oncancel(): void;
    onupdate(params: {user: IUser}): void;
    dirty: boolean;
    errorMessage: string | null;
    loading: boolean;
    xmppEnabled: boolean;
    roles: {[key: string]: any};
    languages: Array<{code: string; nativeName: string}>;
    error: any;
    userForm?: any;
    user?: IUser;
    _active: boolean;
    _pending: boolean;
    profile: boolean;
    userDesks: Array<any>;
    confirm: {password: string | null};
    show: {password: boolean};
    userImmutable: Partial<IUser>;
    profileConfig: any;
    cancel(): void;
    focused(): void;
    editPicture(): void;
    goTo(id: string): void;
    checkNavigation(id: string): boolean;
    save(): void;
    toggleStatus(active: boolean): void;
    metadata: any;
    activeNavigation: any;
    privileges: any;
    features: any;
    usernamePattern: any;
    twitterPattern: any;
    phonePattern: any;
    signOffPattern: any;
    hideSignOff: any;
    isSaving: any;
    $watch: any;
    canChangeAvatar: any;
    isNetworkSubscription: any;
    $parent: any;
    $on: (...args: any) => any;
    $watchCollection: (...args: any) => any;
    currentSessionUser: IUser;
}

const notAllowedToChangeYourself = ['is_active', 'is_enabled'] satisfies Array<keyof IUser>;

export const readOnlyUserFields = ['dateline_source', 'last_activity_at'] satisfies Array<keyof IUser>;

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
        link: function(scope: IScope, elem) {
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
            scope.activeNavigation = null;
            scope.privileges = privileges.privileges;
            scope.currentSessionUser = session.identity;
            scope.features = features;
            scope.usernamePattern = appConfig.user?.username_pattern != null ?
                new RegExp(appConfig.user.username_pattern) : usersService.usernamePattern;
            scope.twitterPattern = usersService.twitterPattern;
            scope.phonePattern = usersService.phonePattern;
            scope.signOffPattern = usersService.signOffPattern;
            scope.hideSignOff = appConfig.user != null && appConfig.user.sign_off_mapping;
            scope.isSaving = false;

            scope.$watch('$parent.$parent.savingInProgress', (newVal) => {
                scope.isSaving = newVal;
            });

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
                    scope.roles = _.keyBy(result._items, '_id');
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

            scope.goTo = function(id) {
                document.getElementById(id).scrollIntoView({
                    behavior: 'smooth',
                });

                scope.activeNavigation = id;
            };

            scope.checkNavigation = function(id) {
                return scope.activeNavigation === id;
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
                        showConfirmationPrompt({
                            title: 'Do you want to reload the page now?',
                            message: 'The page needs to be reloaded to change the language',
                        }).then((confirmed) => {
                            if (confirmed) {
                                resolve(true);
                            }
                        });
                    }
                })
                    .then((reloadPage) => {
                        scope.error = null;

                        /**
                         * onSave from parent scope(UserEditController) needs to be used when editing a user
                         * (because UserEditController stores latest user with latest etag
                         * which will be used my extension point)
                         * usersService.save is only intended to be used when creating a new user
                         */
                        const fieldsToOmit: Array<keyof IUser> = readOnlyUserFields;

                        if (session.identity._id === scope.user._id) {
                            fieldsToOmit.push(...notAllowedToChangeYourself);
                        }

                        const cleanedUser = omit(scope.user, fieldsToOmit);
                        const save = scope.$parent?.$parent?.onSave?.(cleanedUser) ?? usersService.save(
                            scope.origUser,
                            generate(omit(scope.origUser, fieldsToOmit), cleanedUser),
                        );

                        return save
                            .then((response) => {
                                notify.success(gettext('Saved'));

                                scope.origUser = response;
                                resetUser();

                                scope.onsave({user: scope.origUser});
                                metadata.fetchAuthors(self);

                                if (scope.user._id === session.identity._id) {
                                    session.updateIdentity(scope.origUser);
                                }

                                userList.clearCache();

                                if (reloadPage === true) {
                                    window.location.reload();
                                }
                            })
                            .catch((response) => {
                                if (response.status === 404) {
                                    if ($location.path() === '/users/') {
                                        $route.reload();
                                    } else {
                                        $location.path('/users/');
                                    }

                                    notify.error(gettext('User was not found. The account might have been deleted.'));
                                } else {
                                    let errorMessage = gettext('There was an error when saving the user account. ');

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
                            scope.user = {} as IUser;

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
                                scope.userImmutable = {...scope.user};
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
