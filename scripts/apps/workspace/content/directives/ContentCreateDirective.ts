import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IArticle} from 'superdesk-api';

ContentCreateDirective.$inject = [
    'desks',
    'templates',
    'content',
    'authoringWorkspace',
    'superdesk',
    'keyboardManager',
    '$location',
];

interface IScope extends ng.IScope {
    onCreated?: (item: IArticle) => Promise<IArticle>;
    defaultTemplate: any;
    openUpload: () => void;
    createFromTemplate: (template: any) => void;
    canCreatePackage: () => boolean;
    createPackage: () => void;
    create: (type?: any) => void;
    contentTemplates: any;
}

export function ContentCreateDirective(
    desks,
    templates,
    content,
    authoringWorkspace: AuthoringWorkspaceService,
    superdesk,
    keyboardManager,
    $location,
) {
    return {
        scope: {
            onCreated: '=',
        },
        templateUrl: 'scripts/apps/workspace/content/views/sd-content-create.html',
        link: function(scope: IScope) {
            /**
             * Start editing given item in sidebar editor
             *
             * @param {Object} item
             */
            function edit(item) {
                authoringWorkspace.edit(item);
            }

            function getRecentTemplates(deskId) {
                var NUM_ITEMS = 5;

                return templates.getRecentTemplates(deskId, NUM_ITEMS).then((result) => {
                    scope.contentTemplates = result._items;
                });
            }

            /**
             * Create and start editing item of given type
             *
             * @param {string} type
             */
            scope.create = function(type) {
                content.createItem(type).then(edit);
            };

            /**
             * Create and start editing a package
             */
            scope.createPackage = function() {
                content.createPackageItem().then(edit);
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

            /**
             * Create and start editing an item based on given package
             *
             * @param {Object} template
             */
            scope.createFromTemplate = function(template) {
                content.createItemFromTemplate(template)
                    .then((item: IArticle) => {
                        if (typeof scope.onCreated === 'function') {
                            scope.onCreated(item);
                        }

                        edit(item);
                        getRecentTemplates(desks.activeDeskId);
                    });
            };

            /**
             * Start content upload modal
             */
            scope.openUpload = function openUpload() {
                superdesk.intent('upload', 'media', {deskSelectionAllowed: true});
            };

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

                scope.defaultTemplate ? scope.createFromTemplate(scope.defaultTemplate) : scope.create();
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
