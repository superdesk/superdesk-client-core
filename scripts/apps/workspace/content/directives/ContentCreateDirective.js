ContentCreateDirective.$inject = ['api', 'desks', 'templates', 'content', 'authoringWorkspace',
    'superdesk', 'keyboardManager', '$location'];

export function ContentCreateDirective(api, desks, templates, content, authoringWorkspace, superdesk, keyboardManager,
    $location) {
    return {
        scope: true,
        templateUrl: 'scripts/apps/workspace/content/views/sd-content-create.html',
        link: function(scope) {
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

                return templates.getRecentTemplates(desks.activeDeskId, NUM_ITEMS).then(function(result) {
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

            /**
             * Create and start editing an item based on given package
             *
             * @param {Object} template
             */
            scope.createFromTemplate = function(template) {
                content.createItemFromTemplate(template).then(edit).then(function() {
                    getRecentTemplates(desks.activeDeskId);
                });
            };

            /**
             * Start content upload modal
             */
            scope.openUpload = function openUpload() {
                superdesk.intent('upload', 'media');
            };

            scope.contentTemplates = null;

            desks.initialize().then(function() {
                scope.$watch(function() {
                    return desks.active.desk;
                }, function(activeDeskId) {
                    getRecentTemplates(activeDeskId);

                    content.getDeskProfiles(activeDeskId ? desks.getCurrentDesk() : null)
                        .then(function(profiles) {
                            scope.profiles = profiles;
                        });
                });
            });

            keyboardManager.bind('ctrl+m', function(e) {
                if (e) {
                    e.preventDefault();
                }
                scope.create();
            });

            scope.$on('$destroy', function() {
                keyboardManager.unbind('ctrl+m');
            });

            /**
             * Create a new item using given type and start editing
             *
             * @param {Object} contentType
             */
            scope.createFromType = function(contentType) {
                content.createItemFromContentType(contentType).then(edit);
            };
        }
    };
}
