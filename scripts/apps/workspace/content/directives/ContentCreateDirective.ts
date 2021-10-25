import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IArticle} from 'superdesk-api';
import {IContentTemplate} from 'superdesk-interfaces/ContentTemplate';
import {assertNever, isArray} from 'core/helpers/typescript-helpers';

type IItemCreationAction =
    { kind: 'plain-text'}
    | {kind: 'from-template'; template: IContentTemplate}
    | {kind: 'create-package'}
    | {kind: 'upload-media'}
;

ContentCreateDirective.$inject = [
    'desks',
    'templates',
    'content',
    'authoringWorkspace',
    'superdesk',
    'keyboardManager',
    '$location',
    'packages',
    'storage',
    'autosave',
    'superdeskFlags',
];

interface IScope extends ng.IScope {
    createFromTemplate: (template: IContentTemplate) => Promise<IArticle>;
    create: (action: IItemCreationAction) => Promise<IArticle>;
    onCreated?: (item: Array<IArticle>) => void;
    defaultTemplate: any;
    canCreatePackage: () => boolean;
    createPackage: () => void;
    contentTemplates: any;

    // If an item is created, but closed without changes, it gets removed
    // it doesn't work well when creating item and adding as related immediately
    // user might want to go back and update the item later.
    // To avoid the item getting removed it is initialized with a higher version
    initializeAsUpdated: boolean;
}

export function ContentCreateDirective(
    desks,
    templates,
    content,
    authoringWorkspace: AuthoringWorkspaceService,
    superdesk,
    keyboardManager,
    $location,
    packages,
    storage,
    autosave,
    superdeskFlags,
) {
    return {
        scope: {
            onCreated: '=',
            initializeAsUpdated: '=',
        },
        templateUrl: 'scripts/apps/workspace/content/views/sd-content-create.html',
        link: function(scope: IScope) {
            function getRecentTemplates(deskId) {
                var NUM_ITEMS = 5;

                return templates.getRecentTemplates(deskId, NUM_ITEMS).then((result) => {
                    scope.contentTemplates = result._items;
                });
            }

            scope.create = function(action: IItemCreationAction) {
                superdeskFlags.flags.authoring = true;

                return (() => {
                    if (action.kind === 'plain-text') {
                        return content.createItem('text', scope.initializeAsUpdated);
                    } else if (action.kind === 'from-template') {
                        return content.createItemFromTemplate(action.template, scope.initializeAsUpdated)
                            .then((item: IArticle) => {
                                getRecentTemplates(desks.activeDeskId);

                                return item;
                            });
                    } else if (action.kind === 'create-package') {
                        return packages.createEmptyPackage(undefined, scope.initializeAsUpdated);
                    } else if (action.kind === 'upload-media') {
                        return superdesk.intent('upload', 'media', {deskSelectionAllowed: true});
                    } else {
                        assertNever(action);
                    }
                })().then((result: IArticle | Array<IArticle>) => {
                    if (typeof scope.onCreated === 'function') {
                        scope.onCreated(
                            isArray(result) ? result : [result],
                        );
                    }

                    if (action.kind !== 'upload-media' && !isArray(result)) {
                        authoringWorkspace.edit(result);
                    } else {
                        superdeskFlags.flags.authoring = false;
                    }
                }).catch(() => {
                    superdeskFlags.flags.authoring = false;
                    scope.$applyAsync();
                });
            };

            scope.$on('item:close', (evt, mainArticleId) => {
                const itemId = storage.getItem(`open-item-after-related-closed--${mainArticleId}`);

                if (itemId != null) {
                    return autosave.get({_id: itemId}).then((resulted) => {
                        authoringWorkspace.open(resulted);
                        storage.removeItem(`open-item-after-related-closed--${mainArticleId}`);
                    });
                }
            });

            scope.createFromTemplate = function(template: IContentTemplate) {
                return scope.create({kind: 'from-template', template});
            };

            /**
             * Do not allow packages to be created from personal workspace
            **/
            scope.canCreatePackage = function() {
                return $location.path() !== '/workspace/personal';
            };

            scope.$on('template:update', (e, data) => {
                getRecentTemplates(desks.activeDeskId);
                getDefaultTemplate();
            });

            scope.contentTemplates = null;

            desks.initialize().then(() => {
                scope.$watch(() => desks.active.desk, (activeDeskId) => {
                    getRecentTemplates(activeDeskId);
                    getDefaultTemplate();
                });
            });

            keyboardManager.bind('ctrl+m', (e) => {
                if (e) {
                    e.preventDefault();
                }

                if (scope.defaultTemplate) {
                    scope.create({kind: 'from-template', template: scope.defaultTemplate});
                } else {
                    scope.create({kind: 'plain-text'});
                }
            });

            scope.$on('$destroy', () => {
                keyboardManager.unbind('ctrl+m');
            });

            function getDefaultTemplate() {
                const desk = desks.getCurrentDesk();

                scope.defaultTemplate = null;
                if (desk && desk.default_content_template) {
                    templates.find(desk.default_content_template).then((template) => {
                        scope.defaultTemplate = template;
                    });
                }
            }
        },
    };
}
