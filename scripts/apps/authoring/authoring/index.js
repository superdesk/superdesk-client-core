import 'angular-history/history';

import * as svc from './services';
import * as directive from './directives';
import * as ctrl from './controllers';
import * as filter from './filters';

import 'apps/authoring/suggest';

angular.module('superdesk.apps.authoring.autosave', []).service('autosave', svc.AutosaveService);

/**
 * @ngdoc module
 * @module superdesk.apps.authoring
 * @name superdesk.apps.authoring
 * @packageName superdesk.apps
 * @description Superdesk authoring application module.
 */
angular.module('superdesk.apps.authoring', [
    'superdesk.core.menu',
    'superdesk.core.activity',
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.authoring.metadata',
    'superdesk.apps.authoring.comments',
    'superdesk.apps.authoring.track-changes.inline-comments',
    'superdesk.apps.authoring.track-changes.suggestions',
    'superdesk.apps.authoring.versioning',
    'superdesk.apps.authoring.versioning.versions',
    'superdesk.apps.authoring.versioning.history',
    'superdesk.apps.authoring.workqueue',
    'superdesk.apps.authoring.packages',
    'superdesk.apps.authoring.find-replace',
    'superdesk.apps.authoring.macros',
    'superdesk.apps.authoring.attachments',
    'superdesk.apps.authoring.autosave',
    'superdesk.apps.authoring.suggest',
    'superdesk.apps.desks',
    'superdesk.apps.notification',
    'contenteditable',
    'decipher.history',
    'superdesk.config'
])

    .service('authoring', svc.AuthoringService)
    .service('confirm', svc.ConfirmDirtyService)
    .service('lock', svc.LockService)
    .service('authThemes', svc.AuthoringThemesService)
    .service('authoringWorkspace', svc.AuthoringWorkspaceService)
    .service('renditions', svc.RenditionsService)
    .service('mediaIdGenerator', svc.MediaIdGeneratorService)

    .factory('history', svc.HistoryFactory)

    .directive('html5vfix', directive.Html5vfix)
    .directive('sdDashboardCard', directive.DashboardCard)
    .directive('sdSendItem', directive.SendItem)
    .directive('sdCharacterCount', directive.CharacterCount)
    .directive('sdWordCount', directive.WordCount)
    .directive('sdReadingTime', directive.ReadingTime)
    .directive('sdThemeSelect', directive.ThemeSelectDirective)
    .directive('sdArticleEdit', directive.ArticleEditDirective)
    .directive('sdAuthoring', directive.AuthoringDirective)
    .directive('sdAuthoringTopbar', directive.AuthoringTopbarDirective)
    .directive('sdPreviewFormatted', directive.PreviewFormattedDirective)
    .directive('sdAuthoringContainer', directive.AuthoringContainerDirective)
    .directive('sdAuthoringEmbedded', directive.AuthoringEmbeddedDirective)
    .directive('sdAuthoringHeader', directive.AuthoringHeaderDirective)
    .directive('sdItemAssociation', directive.ItemAssociationDirective)
    .directive('sdItemCarousel', directive.ItemCarouselDirective)
    .directive('sdFullPreview', directive.FullPreviewDirective)
    .directive('sdRemoveTags', directive.RemoveTagsDirective)
    .directive('tansaScopeSync', directive.TansaScopeSyncDirective)
    .directive('sdItemActionByIntent', directive.ItemActionsByIntentDirective)

    .filter('embeddedFilter', filter.EmbeddedFilter)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('authoring', {
                category: '/authoring',
                href: '/authoring/:_id',
                when: '/authoring/:_id',
                label: gettext('Authoring'),
                templateUrl: 'scripts/apps/authoring/views/authoring.html',
                topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                controller: ctrl.AuthoringController,
                filters: [{action: 'author', type: 'article'}],
                resolve: {
                    item: ['$route', 'authoring', function($route, authoring) {
                        return authoring.open($route.current.params._id, false);
                    }],
                    action: [function() {
                        return 'edit';
                    }]
                },
                authoring: true
            })
            .activity('edit.item', {
                label: gettext('Edit'),
                priority: 10,
                icon: 'pencil',
                keyboardShortcut: 'ctrl+alt+e',
                controller: ['data', 'authoringWorkspace', function(data, authoringWorkspace) {
                    authoringWorkspace.edit(data.item ? data.item : data);
                }],
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'edit', type: 'item'}
                ],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).edit;
                }]
            })
            .activity('edit.item.popup', {
                label: gettext('Edit in new Window'),
                priority: 5,
                icon: 'pencil',
                keyboardShortcut: 'ctrl+alt+n',
                controller: ['data', 'authoringWorkspace', (data, authoringWorkspace) => {
                    authoringWorkspace.popup(data.item, 'edit');
                }],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', 'config', function(authoring, item, config) {
                    return authoring.itemActions(item).edit;
                }]
            })
            .activity('move.item', {
                label: gettext('Send to'),
                icon: 'share-alt',
                controller: ['data', 'send', (data, send) => {
                    send.allAs([data.item]);
                }],
                filters: [{action: 'list', type: 'archive'}],
                permissions: {move: 1}
            })
            .activity('kill.text', {
                label: gettext('Kill item'),
                priority: 100,
                icon: 'kill',
                group: 'corrections',
                controller: ['data', 'authoringWorkspace', 'api', '$rootScope',
                    function(data, authoringWorkspace, api, $rootScope) {
                        if (data.item._type === 'archived') {
                            $rootScope.$broadcast('open:archived_kill', data.item);
                        } else {
                            authoringWorkspace.kill(data.item);
                        }
                    }
                ],
                filters: [{action: 'list', type: 'archive'}, {action: 'list', type: 'archived'}],
                additionalCondition: ['authoring', 'item', 'privileges', function(authoring, item, privileges) {
                    if (item._type === 'archived') {
                        return privileges.privileges.archived && item.type === 'text';
                    }

                    return authoring.itemActions(item).kill;
                }],
                privileges: {kill: 1}
            })
            .activity('correct.text', {
                label: gettext('Correct item'),
                priority: 100,
                icon: 'edit-line',
                group: 'corrections',
                controller: ['data', 'authoringWorkspace', function(data, authoringWorkspace) {
                    authoringWorkspace.correct(data.item);
                }],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).correct;
                }],
                privileges: {correct: 1}
            })
            .activity('view.item', {
                label: gettext('Open'),
                priority: 2000,
                icon: 'external',
                keyboardShortcut: 'alt+o',
                controller: ['data', 'authoringWorkspace', function(data, authoringWorkspace) {
                    authoringWorkspace.view(data.item || data);
                }],
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'list', type: 'archived'},
                    {action: 'list', type: 'legal_archive'},
                    {action: 'view', type: 'item'}
                ],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).view;
                }]
            })
            .activity('view.item.popup', {
                label: gettext('Open in new Window'),
                priority: 1990,
                icon: 'external',
                keyboardShortcut: 'ctrl+alt+n',
                controller: ['data', 'authoringWorkspace', (data, authoringWorkspace) => {
                    authoringWorkspace.popup(data.item, 'view');
                }],
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'list', type: 'archived'},
                    {action: 'list', type: 'legal_archive'}
                ],
                additionalCondition: ['authoring', 'item', 'config', function(authoring, item, config) {
                    return authoring.itemActions(item).view;
                }]
            })
            .activity('edit.crop', {
                label: gettext('Edit Crop'),
                modal: true,
                cssClass: 'modal--fullscreen',
                controller: ctrl.ChangeImageController,
                templateUrl: 'scripts/apps/authoring/views/change-image.html',
                filters: [{action: 'edit', type: 'crop'}]
            })
            .activity('preview', {
                href: '/preview/:_id',
                when: '/preview/:_id',
                template: '<div sd-full-preview data-item="item"></div>',
                controller: ['$scope', 'item', function($scope, item) {
                    $scope.item = item;
                }],
                resolve: {
                    item: ['$route', 'api', function($route, api) {
                        return api.find('archive', $route.current.params._id);
                    }]
                }
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('move', {
            type: 'http',
            backend: {
                rel: 'move'
            }
        });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('content_templates_apply', {
            type: 'http',
            backend: {
                rel: 'content_templates_apply'
            }
        });
    }])
    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('Authoring', 'ctrl + shift + u', gettext('Unlock current item'));
        keyboardManager.register('Authoring', 'ctrl + shift + e', gettext('Close current item'));
        keyboardManager.register('Authoring', 'ctrl + shift + s', gettext('Save current item'));
        keyboardManager.register('Authoring', 'ctrl + shift + l',
            gettext('Preview formatted article, when previewFormats feature configured'));
        keyboardManager.register('Authoring', 'ctrl + shift + y',
            gettext('Instant Spellchecking, when automatic spellchecking turned off'));
    }]);
