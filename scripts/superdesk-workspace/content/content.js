(function() {
    'use strict';

    // http://docs.python-cerberus.org/en/stable/usage.html
    var DEFAULT_SCHEMA = Object.freeze({
        slugline: {maxlength: 24, type: 'string'},
        relatedItems: {},
        genre: {type: 'list'},
        anpa_take_key: {},
        place: {type: 'list'},
        priority: {},
        urgency: {},
        anpa_category: {type: 'list'},
        subject: {type: 'list', required: true},
        company_codes: {type: 'list'},
        ednote: {},
        headline: {maxlength: 64, type: 'string'},
        sms: {maxlength: 160},
        abstract: {maxlength: 160, type: 'string'},
        body_html: {},
        byline: {type: 'string'},
        dateline: {type: 'dict'},
        sign_off: {type: 'string'},
        footer: {},
        body_footer: {},
        media: {},
        media_description: {}
    });

    var DEFAULT_EDITOR = Object.freeze({
        slugline: {order: 1, sdWidth: 'full'},
        genre: {order: 2, sdWidth: 'half'},
        anpa_take_key: {order: 3, sdWidth: 'half'},
        place: {order: 4, sdWidth: 'half'},
        priority: {order: 5, sdWidth: 'quarter'},
        urgency: {order: 6, sdWidth: 'quarter'},
        anpa_category: {order: 7, sdWidth: 'full'},
        subject: {order: 8, sdWidth: 'full'},
        company_codes: {order: 9, sdWidth: 'full'},
        ednote: {order: 10, sdWidth: 'full'},
        headline: {order: 11, formatOptions: ['underline', 'anchor', 'bold', 'removeFormat']},
        sms: {order: 12},
        abstract: {order: 13, formatOptions: ['bold', 'italic', 'underline', 'anchor', 'removeFormat']},
        byline: {order: 14},
        dateline: {order: 15},
        body_html: {
            order: 16,
            formatOptions: ['h2', 'bold', 'italic', 'underline', 'quote', 'anchor', 'embed', 'picture', 'removeFormat']
        },
        footer: {order: 17},
        body_footer: {order: 18},
        sign_off: {order: 19},
        media: {},
        media_description: {}
    });

    angular.module('superdesk.workspace.content', [
        'superdesk.api',
        'superdesk.archive',
        'superdesk.templates',
        'superdesk.packaging'
    ])
        .service('content', ContentService)
        .directive('sdContentCreate', ContentCreateDirective)
        .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
            keyboardManager.register('General', 'ctrl + m', gettext('Creates new item'));
        }])
        ;

    ContentService.$inject = ['api', 'superdesk', 'templates', 'desks', 'packages', 'archiveService'];
    function ContentService(api, superdesk, templates, desks, packages, archiveService) {

        var TEXT_TYPE = 'text';

        function newItem(type) {
            return {
                type: type || TEXT_TYPE,
                version: 0
            };
        }

        /**
         * Save data to content api
         *
         * @param {Object} data
         * @return {Promise}
         */
        function save(data) {
            return api.save('archive', data);
        }

        /**
         * Create an item of given type
         *
         * @param {string} type
         * @return {Promise}
         */
        this.createItem = function(type) {
            var item = newItem(type);
            archiveService.addTaskToArticle(item);
            return save(item);
        };

        /**
         * Create a package containing given item
         *
         * @param {Object} item
         * @return {Promise}
         */
        this.createPackageItem = function(item) {
            var data = item ? {items: [item]} : {};
            return packages.createEmptyPackage(data);
        };

        /**
         * Create a package containing given item
         *
         * @param {Object} item
         * @return {Promise}
         */
        this.createPackageFromItems = function(item) {
            return packages.createPackageFromItems([item]);
        };

        /**
         * Create new item using given template
         *
         * @param {Object} template
         * @return {Promise}
         */
        this.createItemFromTemplate = function(template) {
            var item = newItem(template.data.type || null);
            angular.extend(item, templates.pickItemData(template.data || {}), {template: template._id});
            archiveService.addTaskToArticle(item);
            return save(item).then(function(_item) {
                templates.addRecentTemplate(desks.activeDeskId, template._id);
                return _item;
            });
        };

        /**
         * Create new item using given content type
         *
         * @param {Object} contentType
         * @return {Promise}
         */
        this.createItemFromContentType = function(contentType) {
            var item = {
                type: TEXT_TYPE,
                profile: contentType._id,
                version: 0
            };

            archiveService.addTaskToArticle(item);

            return save(item);
        };

        /**
         * Get content types from server
         *
         * @return {Promise}
         */
        this.getTypes = function() {
            var self = this;
            var where = {enabled: true};
            return api.query('content_types', {where: where}).then(function(result) {
                self.types = result._items.sort(function(a, b) {
                    return b.priority - a.priority; // with higher priority goes up
                });
                return self.types;
            }, function(reason) {
                self.types = [];
                return self.types;
            });
        };

        /**
         * Get content type by id
         *
         * @param {string} id
         * @return {Promise}
         */
        this.getType = function(id) {
            return api.find('content_types', id);
        };

        /**
         * Get schema for given content type
         *
         * @param {Object} contentType
         * @return {Object}
         */
        this.schema = function(contentType) {
            return contentType && contentType.schema ? angular.extend({}, contentType.schema) : DEFAULT_SCHEMA;
        };

        /**
         * Get editor config for given content type
         *
         * @param {Object} contentType
         * @return {Object}
         */
        this.editor = function(contentType) {
            return contentType && contentType.editor ? angular.extend({}, contentType.editor) : DEFAULT_EDITOR;
        };
    }

    ContentCreateDirective.$inject = ['api', 'desks', 'templates', 'content', 'authoringWorkspace', 'superdesk', 'keyboardManager',
    '$location'];
    function ContentCreateDirective(api, desks, templates, content, authoringWorkspace, superdesk, keyboardManager,
        $location) {
        return {
            scope: true,
            templateUrl: 'scripts/superdesk-workspace/content/views/sd-content-create.html',
            link: function(scope) {
                var NUM_ITEMS = 5;

                /**
                 * Start editing given item in sidebar editor
                 *
                 * @param {Object} item
                 */
                function edit(item) {
                    authoringWorkspace.edit(item);
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
                        templates.getRecentTemplates(desks.activeDeskId, NUM_ITEMS)
                        .then(function(result) {
                            scope.contentTemplates = result;
                        });
                    });
                };

                /**
                 * Start content upload modal
                 */
                scope.openUpload = function openUpload() {
                    superdesk.intent('upload', 'media');
                };

                scope.contentTemplates = null;

                scope.$watch(function() {
                    return desks.activeDeskId;
                }, function() {
                    templates.getRecentTemplates(desks.activeDeskId, NUM_ITEMS)
                    .then(function(result) {
                        scope.contentTemplates = result;
                    });
                });

                keyboardManager.bind('ctrl+m', function(e) {
                    if (e) {
                        e.preventDefault();
                    }
                    scope.create();
                });

                /**
                 * Create a new item using given type and start editing
                 *
                 * @param {Object} contentType
                 */
                scope.createFromType = function(contentType) {
                    content.createItemFromContentType(contentType).then(edit);
                };

                /**
                 * Populate list of available content types
                 */
                content.getTypes().then(function() {
                    scope.content_types = content.types;
                });
            }
        };
    }
})();
