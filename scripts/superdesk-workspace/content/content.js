// http://docs.python-cerberus.org/en/stable/usage.html
var DEFAULT_SCHEMA = Object.freeze({
    slugline: {maxlength: 24, type: 'string', required: true},
    relatedItems: {},
    genre: {type: 'list'},
    anpa_take_key: {type: 'string'},
    place: {type: 'list'},
    priority: {type: 'integer'},
    urgency: {type: 'integer'},
    anpa_category: {type: 'list', required: true},
    subject: {type: 'list', required: true},
    company_codes: {type: 'list'},
    ednote: {type: 'string'},
    headline: {maxlength: 42, type: 'string', required: true},
    sms: {maxlength: 160, type: 'string'},
    abstract: {maxlength: 160, type: 'string'},
    body_html: {required: true, type: 'string'},
    byline: {type: 'string'},
    dateline: {type: 'dict', required: false},
    sign_off: {type: 'string'},
    footer: {},
    body_footer: {type: 'string'},
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

var CV_ALIAS = Object.freeze({
    locators: 'place'
});

angular.module('superdesk.workspace.content', [
    'superdesk.api',
    'superdesk.menu',
    'superdesk.archive',
    'superdesk.templates',
    'superdesk.packaging'
])
    .service('content', ContentService)
    .directive('sdContentCreate', ContentCreateDirective)
    .directive('stringToArray', StringToArrayDirective)
    .directive('sdContentSchemaEditor', ContentProfileSchemaEditor)
    .directive('sdItemProfile', ItemProfileDirective)
    .controller('ContentProfilesController', ContentProfilesController)
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/content-profiles', {
                label: gettext('Content Profiles'),
                controller: ContentProfilesController,
                controllerAs: 'ctrl',
                templateUrl: 'scripts/superdesk-workspace/content/views/profile-settings.html',
                category: superdesk.MENU_SETTINGS,
                priority: 100,
                privileges: {content_type: 1}
            });
    }])
    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('General', 'ctrl + m', gettext('Creates new item'));
    }]);

ContentService.$inject = ['api', 'superdesk', 'templates', 'desks', 'packages', 'archiveService', '$filter'];
function ContentService(api, superdesk, templates, desks, packages, archiveService, $filter) {

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
        // set the dateline date to default utc date.
        if (item.dateline && item.dateline.located) {
            item.dateline = _.omit(item.dateline, 'text');
            item.dateline.date = $filter('formatDateTimeString')();
        }
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
     * Creates a new content profile.
     *
     * @param {Object} data
     * @return {Promise}
     */
    this.createProfile = function(data) {
        return api.save('content_types', data);
    };

    /**
     * Creates a new content profile.
     *
     * @param {Object} item
     * @param {Object} updates
     * @return {Promise}
     */
    this.updateProfile = function(item, updates) {
        return api.update('content_types', item, updates);
    };

    /**
     * Creates a new content profile.
     *
     * @param {Object} item
     * @return {Promise}
     */
    this.removeProfile = function(item) {
        return api.remove(item, {}, 'content_types');
    };

    /**
     * Get content types from server
     *
     * @param {Boolean} includeDisabled
     * @return {Promise}
     */
    this.getTypes = function(includeDisabled) {
        var self = this;
        var params = {};

        if (!includeDisabled) {
            params = {where: {enabled: true}};
        }

        // cache when fetching all types
        return api.query('content_types', params, !!includeDisabled).then(function(result) {
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
     * Get types lookup
     *
     * @return {Promise}
     */
    this.getTypesLookup = function() {
        return this.getTypes(true).then(function(profiles) {
            var lookup = {};

            profiles.forEach(function(profile) {
                lookup[profile._id] = profile;
            });

            return lookup;
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

    /**
     * Get profiles selected for given desk
     *
     * @param {Object} desk
     * @return {Promise}
     */
    this.getDeskProfiles = function(desk) {
        return this.getTypes().then(function(profiles) {
            return !desk || _.isEmpty(desk.content_profiles) ?
                profiles :
                profiles.filter(function(profile) {
                    return desk.content_profiles[profile._id];
                }
            );
        });
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

ContentProfilesController.$inject = ['$scope', 'notify', 'content', 'modal', '$q'];
function ContentProfilesController($scope, notify, content, modal, $q) {
    var that = this;

    // creating will be true while the modal for creating a new content
    // profile is visible.
    $scope.creating = false;

    // editing will hold data about the content profile being edited, as well
    // as the bind to the editing form. If no profile is being edited, it will
    // be null.
    $scope.editing = null;

    /**
     * @description Refreshes the list of content profiles by fetching them.
     * @returns {Promise}
     * @private
     */
    function refreshList() {
        return content.getTypes(true).then(function(types) {
            that.items = types;
        });
    }

    /**
     * @description Reports that an error has occurred.
     * @private
     */
    function reportError(resp) {
        notify.error('Operation failed (check console for response).');
        console.error(resp);
        return $q.reject(resp);
    }

    /**
     * @description Middle-ware that checks an error response to verify whether
     * it is a duplication error.
     * @param {Function} next The function to be called when error is not a
     * duplication error.
     * @private
     */
    function uniqueError(next) {
        return function(resp) {
            if (angular.isObject(resp) &&
                angular.isObject(resp.data) &&
                angular.isObject(resp.data._issues) &&
                angular.isObject(resp.data._issues.label) &&
                resp.data._issues.label.unique) {
                notify.error(that.duplicateErrorTxt);
                return $q.reject(resp);
            }
            return next(resp);
        };
    }

    this.duplicateErrorTxt = gettext('A content profile with this name already exists.');

    /**
     * @description Toggles the visibility of the creation modal.
     */
    this.toggleCreate = function() {
        $scope.new = {};
        $scope.creating = !$scope.creating;
    };

    /**
     * @description Toggles the visibility of the profile editing modal.
     * @param {Object} p the content profile being edited.
     */
    this.toggleEdit = function(p) {
        $scope.editing = angular.isObject(p) ? {
            form: _.cloneDeep(p),
            original: p
        } : null;
    };

    /**
     * @description Creates a new content profile.
     */
    this.save = function() {
        var onSuccess = function(resp) {
            refreshList();
            that.toggleCreate();
            return resp;
        };

        content.createProfile($scope.new)
            .then(onSuccess, uniqueError(reportError))
            .then(this.toggleEdit);
    };

    /**
     * @description Commits the changes made in the editing form for a profile
     * to the server.
     */
    this.update = function() {
        var e = $scope.editing;
        var diff = {};

        Object.keys(e.form).forEach(function(k) {
            if (!_.isEqual(e.form[k], e.original[k])) {
                diff[k] = e.form[k];
            }
        });

        content.updateProfile(e.original, diff)
            .then(refreshList, reportError)
            .then(this.toggleEdit.bind(this, null));
    };

    /**
     * @description Queries the user for confirmation and deletes the content profile.
     */
    this.delete = function(item) {
        modal.confirm('Are you sure you want to delete this profile?').then(function() {
            content.removeProfile(item)
                .then(refreshList, reportError)
                .then(this.toggleEdit.bind(this, null));
        }.bind(this));
    };

    refreshList();
}

ContentProfileSchemaEditor.$inject = ['gettext', 'metadata'];
function ContentProfileSchemaEditor(gettext, metadata) {
    // labelMap maps schema entry keys to their display names.
    var labelMap = {
        'headline': gettext('Headline'),
        'slugline': gettext('Slug'),
        'genre': gettext('Genre'),
        'anpa_take_key': gettext('Take Key'),
        'place': gettext('Place'),
        'priority': gettext('Priority'),
        'urgency': gettext('Urgency'),
        'anpa_category': gettext('Category'),
        'subject': gettext('Subject'),
        'ednote': gettext('Editorial Note'),
        'abstract': gettext('Abstract'),
        'age_range': gettext('Age Range'),
        'assets': gettext('Assets'),
        'body_html': gettext('Body HTML'),
        'byline': gettext('Byline'),
        'dateline': gettext('Dateline'),
        'located': gettext('Located'),
        'sign_off': gettext('Sign Off'),
        'sms': gettext('SMS'),
        'body_footer': gettext('Body footer'),
        'footer': gettext('Footer'),
        'media': gettext('Media'),
        'media_description': gettext('Media Description'),
        'credit_level': gettext('Credit Level'),
        'desired_response': gettext('Desired Response'),
        'feature_image': gettext('Feature Image'),
        'featured': gettext('Featured'),
        'reader_type': gettext('Reader Type'),
        'relatedItems': gettext('Related Items'),
        'subservice_motoring': gettext('Motoring Subservice'),
        'subservice_real_life': gettext('Real Life Subservice'),
        'subservice_sport': gettext('Sport Subservice'),
        'territory': gettext('Territory'),
        'topic_news': gettext('Topic (News)'),
        'topic_sport': gettext('Topic (Sport)'),
        'company_codes': gettext('Company Codes')
    };

    return {
        restrict: 'E',
        templateUrl: 'scripts/superdesk-workspace/content/views/schema-editor.html',
        require: '^form',
        scope: {
            model: '=ngModel'
        },
        link: function(scope, elem, attr, form) {

            scope.model.schema = scope.model.schema || {};
            scope.model.editor = scope.model.editor || {};
            scope.schema = angular.extend({}, DEFAULT_SCHEMA);
            scope.editor = angular.extend({}, DEFAULT_EDITOR);

            metadata.initialize().then(function() {
                scope.options = {subject: metadata.values.subjectcodes};
                scope.terms = {
                    subject: metadata.values.subjectcodes,
                    anpa_category: metadata.values.categories
                };
                metadata.cvs.forEach(function(cv) {
                    var cvId = CV_ALIAS[cv._id] || cv._id;
                    if (scope.schema[cvId]) {
                        scope.options[cvId] = cv.items;
                    }
                });
            });

            scope.formatingOptions = [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
                'outdent', 'indent', 'unorderedlist', 'orderedlist',
                'pre', 'quote', 'image', 'anchor', 'superscript', 'subscript', 'strikethrough',
                'underline', 'italic', 'bold', 'table'
            ];

            /**
             * @description label returns the display name for a key.
             */
            scope.label = function(id) {
                if (labelMap.hasOwnProperty(id)) {
                    return labelMap[id];
                }

                console.warn('could not find label for ' + id +
                    '. Please add it in (superdesk-workspace/content/content.js).ContentProfileSchemaEditor/labelMap');
                return id;
            };

            /**
             * @description Toggles whether a field is enabled or not.
             * @param {String} id the key of the field to toggle.
             */
            scope.toggle = function(id) {
                scope.model.schema[id] = scope.model.schema[id] ? null : angular.extend({}, DEFAULT_SCHEMA[id]);
                scope.model.editor[id] = !scope.model.schema[id] ? null : angular.extend({}, DEFAULT_EDITOR[id]);
                form.$dirty = true;
            };

            /**
             * Copy value from `id` key into `default` within schema
             *
             * it's a workaround for meta-* directives, those have specific logic based on `id`
             *
             * @param {String} id
             */
            scope.setdefault = function(id) {
                scope.model.schema[id].default = scope.model.schema[id][id];
                form.$dirty = true;
            };

            scope.setDirty = function(dirty) {
                form.$dirty = !!dirty;
            };
        }
    };
}

/**
 * @description Transforms and parses the displayed ng-model of the host
 * from an array to a comma-separated list.
 */
StringToArrayDirective.$inject = [];
function StringToArrayDirective() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ngModel) {
            ngModel.$parsers.push(function(v) {
                return typeof v === 'string' ? v.split(',').map(function(x) {
                    return x.trim();
                }) : [];
            });
            ngModel.$formatters.push(function(v) {
                return Array.isArray(v) ? v.join(', ') : '';
            });
        }
    };
}

ItemProfileDirective.$inject = ['content'];
function ItemProfileDirective(content) {
    return {
        scope: {profileId: '=profile'},
        template: '{{ profile }}',
        link: function(scope) {
            content.getTypesLookup().then(function(lookup) {
                scope.profile = lookup[scope.profileId] ?
                    lookup[scope.profileId].label :
                    scope.profileId;
            });
        }
    };
}
