import 'libs/angular-history/history';

import * as svc from './services';
import * as directive from './directives';
import * as ctrl from './controllers';
import * as filter from './filters';

import '../suggest';
import mediaModule from '../media';
import {reactToAngular1} from 'superdesk-ui-framework';
import {ArticleUrlFields} from './article-url-fields';
import {AuthoringCustomField} from './authoring-custom-field';
import {PreviewCustomField} from './preview-custom-field';
import {ValidateCharacters} from './ValidateCharacters';

import {LineCount} from './components/line-count';
import {PopulateAuthorsController} from './controllers/PopulateAuthorsController';

import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {IArticleSchema} from 'superdesk-interfaces/ArticleSchema';
import {AuthoringTopbarReact} from './authoring-topbar-react';
import {CharacterCount} from './components/CharacterCount';
import {CharacterCountConfigButton} from './components/CharacterCountConfigButton';
import {AuthoringWorkspaceService} from './services';
import {AuthoringMediaActions} from './authoring-media-actions';
import {sdStaticAutocompleteDirective} from './directives/sd-static-autocomplete';
import {VideoThumbnailEditor} from './components/video-thumbnail-editor';
import {FullPreviewDirective} from './directives/FullPreviewDirective';
import {FullPreviewItemDirective} from './directives/FullPreviewItemDirective';
import {HeaderComponentField} from './header-component-field';
import {AuthoringTopbar2React} from './authoring-topbar2-react';
import {appConfig} from 'appConfig';
import {FullPreview} from '../preview/fullPreview';
import {sdApi} from 'api';

export interface IOnChangeParams {
    item: IArticle;
    original: IArticle;
}

export interface IArticleSchemaParams {
    item: IArticle;
    schema: IArticleSchema;
}

type IOnChangeMiddleware = (params: IOnChangeParams) => IArticle;

type IArticleSchemaMiddleware = (params: IArticleSchemaParams) => IArticleSchema;

export const onChangeMiddleware: Array<IOnChangeMiddleware> = [];
export const getArticleSchemaMiddleware: Array<IArticleSchemaMiddleware> = [];

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
    'superdesk.apps.authoring.translations',
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
    'superdesk.apps.vocabularies',
    'superdesk.apps.relations',
    'contenteditable',
    'decipher.history',
    'superdesk.config',
    mediaModule.name,
])

    .service('authoring', svc.AuthoringService)
    .service('confirm', svc.ConfirmDirtyService)
    .service('lock', svc.LockService)
    .service('authThemes', svc.AuthoringThemesService)
    .service('authoringWorkspace', svc.AuthoringWorkspaceService)
    .service('renditions', svc.RenditionsService)

    .factory('history', svc.HistoryFactory)

    .directive('html5vfix', directive.Html5vfix)
    .directive('sdDashboardCard', directive.DashboardCard)
    .directive('sdSendItem', directive.SendItem)
    .component('sdCharacterCount', reactToAngular1(CharacterCount, ['item', 'html', 'limit'], [], 'display: inline'))
    .component('sdCharacterCountConfigButton', reactToAngular1(
        CharacterCountConfigButton, ['field'], [], 'display: inline',
    ))
    .directive('sdWordCount', directive.WordCount)
    .directive('sdReadingTime', directive.ReadingTime)
    .directive('sdThemeSelect', directive.ThemeSelectDirective)
    .component('sdAuthoringMediaActions', reactToAngular1(AuthoringMediaActions, ['article']))
    .directive('sdArticleEdit', directive.ArticleEditDirective)
    .directive('sdAuthoring', directive.AuthoringDirective)
    .directive('sdAuthoringTopbar', directive.AuthoringTopbarDirective)
    .component('sdAuthoringTopbarReact', reactToAngular1(AuthoringTopbarReact, ['article', 'action', 'onChange']))
    .component('sdAuthoringTopbar2React', reactToAngular1(AuthoringTopbar2React, ['article', 'action', 'onChange']))
    .component('sdVideoThumbnailEditor', reactToAngular1(VideoThumbnailEditor, ['item', 'onChange']))
    .directive('sdPreviewFormatted', directive.PreviewFormattedDirective)
    .directive('sdAuthoringContainer', directive.AuthoringContainerDirective)
    .directive('sdAuthoringEmbedded', directive.AuthoringEmbeddedDirective)
    .directive('sdAuthoringHeader', directive.AuthoringHeaderDirective)
    .directive('sdItemAssociation', directive.ItemAssociationDirective)
    .directive('sdItemCarousel', directive.ItemCarouselDirective)
    .directive('sdFullPreview', FullPreviewDirective)
    .directive('sdFullPreviewItem', FullPreviewItemDirective)
    .component('sdFullPreviewReact', reactToAngular1(FullPreview, ['item', 'editor', 'fields', 'hideMedia']))
    .directive('sdRemoveTags', directive.RemoveTagsDirective)
    .directive('tansaScopeSync', directive.TansaScopeSyncDirective)
    .directive('sdItemActionByIntent', directive.ItemActionsByIntentDirective)
    .directive('sdStaticAutocomplete', sdStaticAutocompleteDirective)

    .component('sdLineCount',
        reactToAngular1(
            LineCount,
            ['html'],
            [],
            'display:contents',
        ),
    )

    .component('sdArticleUrlFields',
        reactToAngular1(
            ArticleUrlFields,
            ['label', 'urls', 'helperText', 'onChange', 'fieldId', 'editable', 'required'],
        ),
    )

    .component('sdAuthoringCustomField',
        reactToAngular1(
            AuthoringCustomField,
            ['item', 'field', 'editable', 'onChange', 'template'],
        ),
    )

    .component('sdHeaderComponentField',
        reactToAngular1(
            HeaderComponentField,
            ['item', 'component'],
        ),
    )

    .component('sdPreviewCustomField',
        reactToAngular1(
            PreviewCustomField,
            ['item', 'field'],
        ),
    )

    .component('sdValidateCharacters',
        reactToAngular1(
            ValidateCharacters,
            ['item', 'field'],
        ),
    )

    .controller('PopulateAuthorsController', PopulateAuthorsController)

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
                    }],
                },
                authoring: true,
            })
            .activity('edit.item', {
                label: gettext('Edit'),
                priority: 10,
                icon: 'pencil',
                keyboardShortcut: 'ctrl+alt+e',
                controller: ['data', 'authoringWorkspace', function(
                    data,
                    authoringWorkspace: AuthoringWorkspaceService,
                ) {
                    authoringWorkspace.edit(data.item ? data.item : data);
                }],
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'edit', type: 'item'},
                ],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).edit;
                }],
            })
            .activity('edit.item.popup', {
                label: gettext('Edit in new Window'),
                priority: 5,
                icon: 'pencil',
                keyboardShortcut: 'ctrl+alt+n',
                controller: ['data', 'authoringWorkspace', (data, authoringWorkspace: AuthoringWorkspaceService) => {
                    authoringWorkspace.popup(data.item, 'edit');
                }],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', 'lock', function(authoring, item, lock) {
                    return authoring.itemActions(item).edit && !lock.isLockedByMe(item);
                }],
            })
            .activity('edit.media.metadata', {
                label: gettext('Edit Media Metadata'),
                priority: 3,
                icon: 'edit-line',
                keyboardShortcut: 'ctrl+alt+m',
                controller: ['data', 'multiImageEdit', 'authoring', 'lock',
                    function(data, multiImageEdit, authoring, lock) {
                        lock.lock(data.item, true, 'edit').then((item) => {
                            multiImageEdit.edit([item], (response) => authoring.save(item, response[0]));
                        });
                    }],
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'edit', type: 'metadata'},
                ],
                additionalCondition: ['item', 'authoring', (item, authoring) => {
                    const mediaTypes = ['audio', 'picture', 'video'];

                    return !sdApi.article.isLocked(item)
                        && mediaTypes.includes(item.type)
                        && authoring.itemActions(item).edit;
                }],
            })
            .activity('move.item', {
                label: gettext('Send to'),
                icon: 'share-alt',
                controller: ['data', 'send', (data, send) => {
                    send.allAs([data.item], 'send_to');
                }],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', (authoring, item) =>
                    authoring.itemActions(item).send && item.type !== 'composite',
                ],
            })
            .activity('move.item.personal_space', {
                label: gettext('Send to Personal Space'),
                icon: 'share-alt',
                controller: ['data', 'send', (data, send) => {
                    send.oneAs([data.item][0], '', 'send_to_personal');
                }],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', (authoring, item) =>
                    authoring.itemActions(item).send && item.type !== 'composite'
                    && appConfig?.features?.sendToPersonal
                    && item.task?.desk != null,
                ],
                privileges: {send_to_personal: 1},
            })
            .activity('kill.text', {
                label: gettext('Kill item'),
                priority: 100,
                icon: 'kill',
                group: 'corrections',
                controller: ['data', 'authoringWorkspace', '$rootScope',
                    function(data, authoringWorkspace: AuthoringWorkspaceService, $rootScope) {
                        if (data.item._type === 'archived') {
                            $rootScope.$broadcast('open:archived_kill', data.item, 'kill');
                        } else {
                            authoringWorkspace.kill(data.item);
                        }
                    },
                ],
                filters: [{action: 'list', type: 'archive'}, {action: 'list', type: 'archived'}],
                additionalCondition: ['authoring', 'item', 'privileges', function(authoring, item, privileges) {
                    if (item._type === 'archived') {
                        return privileges.privileges.archived && item.type === 'text';
                    }

                    return authoring.itemActions(item).kill;
                }],
                privileges: {kill: 1},
            })
            .activity('takedown.text', {
                label: gettext('Takedown item'),
                priority: 100,
                icon: 'kill',
                group: 'corrections',
                controller: ['data', 'authoringWorkspace', '$rootScope',
                    function(data, authoringWorkspace: AuthoringWorkspaceService, $rootScope) {
                        if (data.item._type === 'archived') {
                            $rootScope.$broadcast('open:archived_kill', data.item, 'takedown');
                        } else {
                            authoringWorkspace.takedown(data.item);
                        }
                    },
                ],
                filters: [{action: 'list', type: 'archive'}, {action: 'list', type: 'archived'}],
                additionalCondition: ['authoring', 'item', 'privileges', function(authoring, item, privileges) {
                    if (item._type === 'archived') {
                        return privileges.privileges.archived && item.type === 'text';
                    }

                    return authoring.itemActions(item).takedown;
                }],
                privileges: {takedown: 1},
            })
            .activity('correct.text', {
                label: gettext('Correct item'),
                priority: 100,
                icon: 'edit-line',
                group: 'corrections',
                controller: ['data', 'authoringWorkspace', 'authoring', function(
                    data,
                    authoringWorkspace: AuthoringWorkspaceService,
                    authoring,
                ) {
                    if (appConfig?.corrections_workflow
                    && (data.item.state === 'published' || data.item.state === 'corrected')) {
                        authoring.correction(data.item.archive_item);
                    } else {
                        authoringWorkspace.correct(data.item);
                    }
                }],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).correct;
                }],
                privileges: {correct: 1},
            })
            .activity('view.item', {
                label: gettext('Open'),
                priority: 2000,
                icon: 'external',
                keyboardShortcut: 'alt+o',
                controller: ['data', 'authoringWorkspace', function(
                    data,
                    authoringWorkspace: AuthoringWorkspaceService,
                ) {
                    authoringWorkspace.view(data.item || data);
                }],
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'list', type: 'archived'},
                    {action: 'list', type: 'legal_archive'},
                    {action: 'view', type: 'item'},
                ],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).view;
                }],
            })
            .activity('view.item.popup', {
                label: gettext('Open in new Window'),
                priority: 1990,
                icon: 'external',
                keyboardShortcut: 'ctrl+alt+n',
                controller: ['data', 'authoringWorkspace', (data, authoringWorkspace: AuthoringWorkspaceService) => {
                    authoringWorkspace.popup(data.item, 'view');
                }],
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'list', type: 'archived'},
                    {action: 'list', type: 'legal_archive'},
                ],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).view;
                }],
            })
            .activity('edit.crop', {
                label: gettext('Details'),
                modal: true,
                cssClass: 'modal--fullscreen',
                controller: ctrl.ChangeImageController,
                templateUrl: 'scripts/apps/authoring/views/change-image.html',
                filters: [{action: 'edit', type: 'crop'}],
            })
            .activity('unpublish', {
                label: gettext('Unpublish'),
                priority: 50,
                icon: 'kill',
                group: 'corrections',
                controller: ['data', 'authoring', 'api',
                    (data, authoring, api) => {
                        return api.find('archive', data.item._id).then((updatedItem) => {
                            return authoring.unpublish(updatedItem);
                        });
                    },
                ],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', (authoring, item) => authoring.itemActions(item).unpublish],
                privileges: {unpublish: 1},
            })
        ;
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('move', {
            type: 'http',
            backend: {
                rel: 'move',
            },
        });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('content_templates_apply', {
            type: 'http',
            backend: {
                rel: 'content_templates_apply',
            },
        });
    }])
    .run(['keyboardManager', 'gettext', function(keyboardManager) {
        keyboardManager.register('Authoring', 'ctrl + shift + u', gettext('Unlock current item'));
        keyboardManager.register('Authoring', 'ctrl + shift + e', gettext('Close current item'));
        keyboardManager.register('Authoring', 'ctrl + shift + s', gettext('Save current item'));
        keyboardManager.register('Authoring', 'ctrl + shift + l',
            gettext('Preview formatted article, when previewFormats feature configured'));
        keyboardManager.register('Authoring', 'ctrl + shift + y',
            gettext('Instant Spellchecking, when automatic spellchecking turned off'));
    }]);
