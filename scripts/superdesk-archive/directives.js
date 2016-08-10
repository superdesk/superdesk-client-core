(function() {
    'use strict';

    /**
     * Service to handle item dragging
     */
    function DragItemService() {

        /**
         * Start dragging an item - add item data to event
         *
         * @param {Event} event
         * @param {Object} item
         */
        this.start = function(event, item) {
            var dt = event.dataTransfer || event.originalEvent.dataTransfer;
            dt.setData('application/superdesk.item.' + item.type, angular.toJson(item));
            dt.effectAllowed = 'link';

            if (item.renditions && item.renditions.thumbnail) {
                var img = new Image();
                var rendition = item.renditions.thumbnail;
                img.src = rendition.href;
                img.width = rendition.width;
                dt.setDragImage(img, rendition.width / 2, rendition.height / 2);
            }
        };
    }

    return angular.module('superdesk.archive.directives', [
        'superdesk.filters',
        'superdesk.authoring',
        'superdesk.ingest',
        'superdesk.workflow'
    ])
        .directive('sdItemLock', ['api', 'lock', 'privileges', 'desks', function(api, lock, privileges, desks) {
            return {
                templateUrl: 'scripts/superdesk-archive/views/item-lock.html',
                scope: {item: '='},
                link: function(scope) {

                    init();

                    scope.$watch('item.lock_session', function() {
                        init();

                        if (scope.item && lock.isLocked(scope.item)) {
                            api('users').getById(scope.item.lock_user).then(function(user) {
                                scope.lock.user = user;
                                scope.lock.lockbyme = lock.isLockedByMe(scope.item);
                            });
                        }
                    });

                    function init() {
                        scope.privileges = privileges.privileges;
                        scope.lock = {user: null, lockbyme: false};
                    }

                    scope.unlock = function() {
                        lock.previewUnlock = true;
                        lock.unlock(scope.item).then(function() {
                            scope.item.lock_user = null;
                            scope.item.lock_session = null;
                            scope.lock = null;
                            scope.isLocked = false;
                        });
                    };

                    scope.can_unlock = function() {
                        if (lock.can_unlock(scope.item)) {
                            if (scope.item.task && scope.item.task.desk && desks.userDesks) {
                                return _.find(desks.userDesks._items, {_id: scope.item.task.desk});
                            }

                            return true;
                        }

                        return false;
                    };

                    scope.$on('item:lock', function(_e, data) {
                        if (scope.item && scope.item._id === data.item) {
                            scope.item.lock_user = data.user;
                            scope.item.lock_time = data.lock_time;
                            scope.item.lock_session = data.lock_session;
                            scope.$digest();
                        }
                    });

                    scope.$on('item:unlock', function(_e, data) {
                        if (scope.item && scope.item._id === data.item) {
                            scope.item.lock_user = null;
                            scope.item.lock_session = null;
                            scope.$digest();
                        }
                    });
                }
            };
        }])
        .directive('sdItemState', function() {
            return {
                templateUrl: 'scripts/superdesk-archive/views/item-state.html',
                scope: {
                    'state': '=',
                    'embargo': '='
                }
            };
        })
        .directive('sdInlineMeta', function() {
            return {
                templateUrl: 'scripts/superdesk-archive/views/inline-meta.html',
                scope: {
                    'placeholder': '@',
                    'showmeta': '=',
                    'item': '=',
                    'setmeta': '&'
                }
            };
        })
        .directive('sdMediaPreview', ['api', '$rootScope', 'desks', 'superdesk', function(api, $rootScope, desks, superdesk) {
            return {
                templateUrl: 'scripts/superdesk-archive/views/preview.html',
                link: function(scope) {
                    scope.previewRewriteStory = function () {
                        return api.find('archive', scope.item.rewrite_id).then(function(item) {
                            $rootScope.$broadcast('broadcast:preview', {'item': item});
                        });
                    };

                    scope.preview = function(item) {
                        superdesk.intent('preview', 'item', item);
                    };

                    scope.getCompanyCodes = function() {
                        return _.map(scope.item.company_codes, 'qcode').join(', ');
                    };

                    desks.initialize().then(function() {
                        scope.userLookup = desks.userLookup;
                    });
                }
            };
        }])
        .directive('sdMediaPreviewWidget', [function() {
            return {
                scope: {
                    item: '='
                },
                templateUrl: 'scripts/superdesk-archive/views/item-preview.html'
            };
        }])
        .directive('sdItemPreviewContainer', function() {
            return {
                template: '<div ng-if="item" sd-media-view data-item="item" data-close="close()"></div>',
                scope: {},
                link: function(scope) {
                    scope.item = null;

                    scope.$on('intent:preview:item', function(event, intent) {
                        scope.item = intent.data;
                    });

                    /**
                     * Close lightbox
                     */
                    scope.close = function() {
                        scope.item = null;
                    };
                }
            };
        })
        .directive('sdMediaView', ['keyboardManager', 'packages', function(keyboardManager, packages) {
            return {
                templateUrl: 'scripts/superdesk-archive/views/media-view.html',
                scope: {
                    items: '=',
                    item: '=',
                    close: '&'
                },
                link: function(scope, elem) {

                    var packageStack = [];

                    scope.singleItem = null;
                    scope.packageItem = null;

                    scope.prevEnabled = true;
                    scope.nextEnabled = true;

                    var getIndex = function(item) {
                        return _.findIndex(scope.items, {_id: item._id});
                    };

                    var setItem = function(item) {
                        resetStack();
                        scope.item = item;
                        scope.openItem(item);
                        var index = getIndex(scope.item);
                        scope.prevEnabled = index > -1 && !!scope.items[index - 1];
                        scope.nextEnabled = index > -1 && !!scope.items[index + 1];
                    };

                    scope.prev = function() {
                        var index = getIndex(scope.item);
                        if (index > 0) {
                            setItem(scope.items[index - 1]);
                        }
                    };
                    scope.next = function() {
                        var index = getIndex(scope.item);
                        if (index !== -1 && index < scope.items.length - 1) {
                            setItem(scope.items[index + 1]);
                        }
                    };

                    keyboardManager.push('left', scope.prev);
                    keyboardManager.push('right', scope.next);
                    scope.$on('$destroy', function() {
                        keyboardManager.pop('left');
                        keyboardManager.pop('right');
                    });

                    scope.setPackageSingle = function(packageItem) {
                        packages.fetchItem(packageItem).then(function(item) {
                            scope.openItem(item);
                        });
                    };

                    scope.openItem = function(item) {
                        if (item.type === 'composite') {
                            packageStack.push(item);
                            pickPackageItem();
                        }
                        scope.setSingleItem(item);
                    };

                    scope.setSingleItem = function(item) {
                        scope.singleItem = item;
                    };

                    scope.nested = function() {
                        return packageStack.length > 1;
                    };

                    scope.previousPackage = function() {
                        _.remove(packageStack, _.last(packageStack));
                        pickPackageItem();
                        scope.setSingleItem(scope.packageItem);
                    };

                    var pickPackageItem = function() {
                        scope.packageItem = _.last(packageStack) || null;
                    };

                    var resetStack = function() {
                        packageStack = [];
                        scope.packageItem = null;
                    };

                    setItem(scope.item);
                }
            };
        }])
        .directive('sdMediaMetadata', ['userList', 'archiveService', 'metadata', function(userList, archiveService, metadata) {
            return {
                scope: {
                    item: '='
                },
                templateUrl: 'scripts/superdesk-archive/views/metadata-view.html',
                link: function(scope, elem) {

                    scope.$watch('item', reloadData);

                    function reloadData() {
                        var qcodes = [];
                        var cvs = [];

                        metadata.fetchMetadataValues().then(function() {
                            metadata.filterCvs(qcodes, cvs);
                            scope.cvs = _.sortBy(cvs, 'priority');
                            scope.genreInCvs = _.pluck(cvs, 'schema_field').indexOf('genre') !== -1;
                            scope.placeInCvs = _.pluck(cvs, 'schema_field').indexOf('place') !== -1;
                        });

                        scope.originalCreator = scope.item.original_creator;
                        scope.versionCreator = scope.item.version_creator;

                        if (!archiveService.isLegal(scope.item)) {
                            if (scope.item.original_creator) {
                                userList.getUser(scope.item.original_creator)
                                    .then(function(user) {
                                        scope.originalCreator = user.display_name;
                                    });
                            }
                            if (scope.item.version_creator) {
                                userList.getUser(scope.item.version_creator)
                                    .then(function(user) {
                                        scope.versionCreator = user.display_name;
                                    });
                            }
                        }
                    }
                }
            };
        }])
        .directive('sdMediaRelated', ['familyService', 'superdesk', function(familyService, superdesk) {
            return {
                scope: {
                    item: '='
                },
                templateUrl: 'scripts/superdesk-archive/views/related-view.html',
                link: function(scope, elem) {
                    scope.$on('item:duplicate', fetchRelatedItems);

                    scope.$watch('item', function(newVal, oldVal) {
                        if (newVal !== oldVal) {
                            fetchRelatedItems();
                        }
                    });
                    scope.open = function(item) {
                        superdesk.intent('view', 'item', item).then(null, function() {
                            superdesk.intent('edit', 'item', item);
                        });
                    };

                    function fetchRelatedItems() {
                        familyService.fetchItems(scope.item.family_id || scope.item._id, scope.item)
                        .then(function(items) {
                            scope.relatedItems = items;
                        });
                    }

                    fetchRelatedItems();
                }
            };
        }])
        .directive('sdFetchedDesks', ['desks', 'familyService', '$location', 'superdesk',
            function(desks, familyService, $location, superdesk) {
            return {
                scope: {
                    item: '='
                },
                templateUrl: 'scripts/superdesk-archive/views/fetched-desks.html',
                link: function(scope, elem) {

                    scope.$watchGroup(['item', 'item.archived'], function() {
                        if (scope.item) {
                            familyService.fetchDesks(scope.item, false)
                                .then(function(fetchedDesks) {
                                    scope.desks = fetchedDesks;
                                });
                        }
                    });

                    scope.selectFetched = function (desk) {
                        if (desk.isUserDeskMember) {
                            desks.setCurrentDeskId(desk.desk._id);
                            $location.url('/workspace/monitoring');
                            if (desk.count === 1) {
                                superdesk.intent('edit', 'item', desk.item);
                            }
                        }
                    };
                }
            };
        }])
        .directive('sdMetaIngest', ['ingestSources', function(ingestSources) {
            return {
                scope: {
                    item: '='
                },
                template: '{{ name }}',
                link: function(scope) {
                    scope.$watch('item', renderIngest);
                    function renderIngest() {
                        ingestSources.initialize().then(function() {
                            if (scope.item && scope.item.ingest_provider in ingestSources.providersLookup) {
                                scope.name = ingestSources.providersLookup[scope.item.ingest_provider].name ||
                                ingestSources.providersLookup[scope.item.ingest_provider].search_provider;
                            } else {
                                scope.name = '';
                            }
                        });
                    }
                }
            };
        }])
        .directive('sdSingleItem', [ function() {
            return {
                templateUrl: 'scripts/superdesk-archive/views/single-item-preview.html',
                scope: {
                    item: '=',
                    contents: '=',
                    setitem: '&'
                }
            };
        }])
        .directive('sdDraggableItem', ['dragitem', function(dragitem) {
            return {
                link: function(scope, elem) {
                    if (scope.item) {
                        elem.attr('draggable', true);

                        // set item data on event
                        elem.on('dragstart', function(event) {
                            dragitem.start(event, scope.item);
                        });

                        scope.$on('$destroy', function() {
                            elem.off('dragstart');
                        });
                    }
                }
            };
        }])
        .directive('sdItemCrops', ['metadata', function(metadata) {
            return {
                templateUrl: 'scripts/superdesk-archive/views/item-crops.html',
                scope: {
                    item: '='
                },
                link: function(scope, elem) {
                    metadata.initialize().then(function() {
                        scope.crop_sizes = metadata.values.crop_sizes;
                    });
                }
            };
        }])
        .directive('sdItemRendition', function() {
            return {
                templateUrl: 'scripts/superdesk-archive/views/item-rendition.html',
                scope: {
                    item: '=',
                    rendition: '@'
                },
                link: function(scope, elem, attrs) {
                    scope.$watch('item.renditions[rendition].href', function(href) {
                        var figure = elem.find('figure'),
                            oldImg = figure.find('img').css('opacity', 0.5),
                            previewHover = '<div class="preview-overlay"><i class="icon-fullscreen"></i></div>';
                        if (href) {
                            var img = new Image();

                            img.onload = function() {
                                if (oldImg.length) {
                                    oldImg.replaceWith(img);
                                } else {
                                    figure.html(img);
                                    if (attrs.ngClick) {
                                        figure.append(previewHover);
                                    }
                                }

                                if (img.naturalWidth < img.naturalHeight) {
                                    elem.addClass('portrait');
                                } else {
                                    elem.removeClass('portrait');
                                }
                            };

                            img.onerror = function() {
                                figure.html('');
                            };

                            img.src = href;
                        }
                    });
                }
            };
        })
        .directive('sdRatioCalc', ['$window', function($window) {
            return {
                link: function(scope, elem) {

                    var win = angular.element($window);

                    calcRatio();

                    function calcRatio() {
                        scope.ratio = elem.outerWidth() / elem.outerHeight();
                    }

                    function ratioOnResize() {
                        calcRatio();
                        scope.$apply();
                    }

                    win.bind('resize', ratioOnResize);

                    scope.$on('$destroy', function() {
                        win.unbind('resize', ratioOnResize);
                    });
                }
            };
        }])
        .directive('sdHtmlPreview', ['$sce', function($sce) {
            return {
                scope: {sdHtmlPreview: '='},
                template: '<div ng-bind-html="html"></div>',
                link: function(scope, elem, attrs) {
                    scope.$watch('sdHtmlPreview', function(html) {
                        scope.html = $sce.trustAsHtml(html);
                    });
                }
            };
        }])
        .directive('sdProviderMenu', ['$location', function($location) {
            return {
                scope: {items: '='},
                templateUrl: 'scripts/superdesk-archive/views/provider-menu.html',
                link: function(scope, element, attrs) {

                    scope.setProvider = function(provider) {
                        scope.selected = provider;
                        $location.search('provider', scope.selected);
                    };

                    scope.$watchCollection(function() {
                        return $location.search();
                    }, function(search) {
                        if (search.provider) {
                            scope.selected = search.provider;
                        }
                    });

                }
            };
        }])

        .directive('sdGridLayout', function() {
            return {
                templateUrl: 'scripts/superdesk-items-common/views/grid-layout.html',
                scope: {items: '='},
                link: function(scope, elem, attrs) {
                    scope.view = 'mgrid';

                    scope.preview = function(item) {
                        scope.previewItem = item;
                    };
                }
            };
        })

        /*
         * This directive is only temporarly,
         * it will be deleted with content and ingest
         */
        .directive('sdContentResults', ['$location', 'preferencesService', 'packages', 'tags', 'asset', 'search',
            function ($location, preferencesService, packages, tags, asset, search) {
                var update = {
                    'archive:view': {
                        'allowed': [
                            'mgrid',
                            'compact'
                        ],
                        'category': 'archive',
                        'view': 'mgrid',
                        'default': 'mgrid',
                        'label': 'Users archive view format',
                        'type': 'string'
                    }
                };

                return {
                    require: '^sdSearchContainer',
                    templateUrl: asset.templateUrl('superdesk-search/views/search-results.html'),
                    link: function (scope, elem, attr, controller) {

                        var GRID_VIEW = 'mgrid',
                            LIST_VIEW = 'compact';

                        var multiSelectable = (attr.multiSelectable === undefined) ? false : true;

                        scope.flags = controller.flags;
                        scope.selected = scope.selected || {};

                        scope.preview = function preview(item) {
                            if (multiSelectable) {
                                if (_.findIndex(scope.selectedList, {_id: item._id}) === -1) {
                                    scope.selectedList.push(item);
                                } else {
                                    _.remove(scope.selectedList, {_id: item._id});
                                }
                            }
                            scope.selected.preview = item;
                            $location.search('_id', item ? item._id : null);
                        };

                        scope.openSingleItem = function (packageItem) {
                            packages.fetchItem(packageItem).then(function (item) {
                                scope.selected.view = item;
                            });
                        };

                        scope.setview = setView;

                        var savedView;
                        preferencesService.get('archive:view').then(function (result) {
                            savedView = result.view;
                            scope.view = (!!savedView && savedView !== 'undefined') ? savedView : 'mgrid';
                        });

                        scope.$on('key:v', toggleView);

                        function setView(view) {
                            scope.view = view || 'mgrid';
                            update['archive:view'].view = view || 'mgrid';
                            preferencesService.update(update, 'archive:view');
                        }

                        function toggleView() {
                            var nextView = scope.view === LIST_VIEW ? GRID_VIEW : LIST_VIEW;
                            return setView(nextView);
                        }

                        /**
                         * Generates Identifier to be used by track by expression.
                         */
                        scope.generateTrackByIdentifier = function(item) {
                            return search.generateTrackByIdentifier(item);
                        };
                    }
                };
            }])
        .directive('sdArchivedItemKill', ['authoring', 'api', 'notify', 'gettext',
            function(authoring, api, notify, gettext) {
                return {
                    templateUrl: 'scripts/superdesk-archive/views/archived-kill.html',
                    scope: {
                        'item': '='
                    },
                    link: function (scope, elem, attr) {
                        scope._editable = true;

                        var itemToDelete = {'_id': scope.item._id, '_etag': scope.item._etag};
                        api.remove(itemToDelete, {}, 'archived').then(
                            function(response) {
                                var fields = _.union(_.keys(authoring.getContentFieldDefaults()), ['_id', 'versioncreated']);
                                var itemForTemplate = {template_name: 'kill', item: _.pick(scope.item, fields)};

                                api.save('content_templates_apply', {}, itemForTemplate, {}).then(function(result) {
                                    itemForTemplate = _.pick(result, _.keys(authoring.getContentFieldDefaults()));
                                    scope.item = _.create(scope.item);
                                    _.each(itemForTemplate, function(value, key) {
                                        if (!_.isUndefined(value) && !_.isEmpty(value)) {
                                            scope.item[key] = value;
                                        }
                                    });
                                }, function(err) {
                                    notify.error(gettext('Failed to apply kill template to the item.'));
                                });
                            }, function (response) {
                                if (response.data._message) {
                                    notify.error(response.data._message);
                                } else {
                                    notify.error(gettext('Unknown Error: Cannot kill the item'));
                                }
                            }
                        );

                        scope.kill = function () {
                            api.save('archived', scope.item, _.pick(scope.item, ['headline', 'abstract', 'body_html']))
                                .then(function (response) {
                                    notify.success(gettext('Item has been killed.'));
                                    scope.cancel();
                                });
                        };

                        scope.cancel = function() {
                            scope.item = null;
                        };

                    }
                };
            }
        ])

        .directive('sdResendItem', ['subscribersService', 'authoring', 'api', 'notify', 'gettext',
            function(subscribersService, authoring, api, notify, gettext) {
                return {
                    templateUrl: 'scripts/superdesk-archive/views/resend-configuration.html',
                    scope: {item: '='},
                    link: function (scope, elem, attr) {
                        scope.$watch('item', function(item) {
                            scope.selectedSubscribers = {items: []};

                            if (item && !scope.customSubscribers) {
                                subscribersService.fetchTargetableSubscribers().then(function(items) {
                                    scope.customSubscribers = [];
                                    scope.subscribers = items._items;
                                    _.each(items, function(item) {
                                        scope.customSubscribers.push({'qcode': item._id, 'name': item.name});
                                    });
                                });
                            }
                        });

                        function getSubscriberIds() {
                            var subscriberIds = [];
                            _.forEach(scope.selectedSubscribers.items, function(item) {
                                subscriberIds.push(item.qcode);
                            });
                            return subscriberIds;
                        }

                        scope.resendItem = function () {
                            var data = {subscribers: getSubscriberIds(), version: scope.item._current_version};
                            api.save('archive_resend', {}, data, scope.item)
                                .then(function () {
                                    notify.success(gettext('Item has been resent.'));
                                    scope.cancel();
                                }, function (response) {
                                    if (response.data._message) {
                                        notify.error(response.data._message);
                                    } else {
                                        notify.error(gettext('Unknown Error: Cannot resend the item'));
                                    }
                                });
                        };

                        scope.cancel = function() {
                            scope.item = null;
                        };
                    }
                };
            }
        ])
        .service('familyService', ['api', 'desks', function(api, desks) {
            this.fetchItems = function(familyId, excludeItem) {
                var repo = 'archive,published';

                var filter = [
                    {not: {term: {state: 'spiked'}}},
                    {term: {family_id: familyId}}
                ];

                if (excludeItem) {
                    filter.push({not: {term: {unique_id: excludeItem.unique_id}}});
                }

                return api('search').query({
                    repo: repo,
                    source: {
                        query: {filtered: {filter: {
                            and: filter
                        }}},
                        sort: [{versioncreated: 'desc'}],
                        size: 100,
                        from: 0
                    }
                });
            };
            this.fetchDesks = function(item, excludeSelf) {
                return this.fetchItems(item.state === 'ingested' ? item._id : item.family_id, excludeSelf ? item : undefined)
                .then(function(items) {
                    var deskList = [];
                    var deskIdList = []; _.each(items._items, function(i) {
                        if (i.task && i.task.desk && desks.deskLookup[i.task.desk]) {
                            if (deskIdList.indexOf(i.task.desk) < 0) {
                                var _isMember = !_.isEmpty(_.find(desks.userDesks._items, {_id: i.task.desk}));
                                deskList.push(
                                    {
                                        'desk': desks.deskLookup[i.task.desk],
                                        'count': 1,
                                        'itemId': i._id,
                                        'isUserDeskMember': _isMember,
                                        'item': i
                                    });
                                deskIdList.push(i.task.desk);
                            } else {
                                deskList[deskIdList.indexOf(i.task.desk)].count += 1;
                            }
                        }
                    });
                    return deskList;
                });
            };
        }])
        .service('dragitem', DragItemService)

        .directive('sdItemPriority', ['metadata', 'gettext', function(metadata, gettext) {
            metadata.initialize();
            return {
                scope: {priority: '='},
                template: [
                    '<span ng-if="priority" class="priority-label priority-label--{{ priority }}" ',
                    'ng-style="{backgroundColor: color}" title="{{ title }}">{{ short }}</span>'
                ].join(''),
                link: function(scope, elem) {
                    scope.$watch('priority', function(priority) {
                        if (priority) {
                            var spec = metadata.priorityByValue(priority);
                            if (spec) {
                                scope.color = spec.color;
                                scope.short = spec.short || priority;
                                scope.title = spec.name || gettext('Priority');
                            }
                        }
                    });
                }
            };
        }])

        .directive('sdItemUrgency', ['metadata', 'gettext', function(metadata, gettext) {
            metadata.initialize();
            return {
                scope: {urgency: '='},
                template: [
                    '<span ng-if="urgency" class="urgency-label urgency-label--{{ urgency }}" ',
                    'ng-style="{backgroundColor: color}" title="{{ title }}">{{ short }}</span>'
                ].join(''),
                link: function(scope, elem) {
                    scope.$watch('urgency', function(urgency) {
                        if (urgency) {
                            var spec = metadata.urgencyByValue(urgency);
                            if (spec) {
                                scope.color = spec.color;
                                scope.short = spec.short || urgency;
                                scope.title = spec.name || gettext('Urgency');
                            }
                        }
                    });
                }
            };
        }]);
})();
