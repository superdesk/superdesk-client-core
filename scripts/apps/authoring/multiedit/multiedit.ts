/**
 * This file is part of Superdesk.
 *
 * Copyright 2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import {gettext} from 'core/utils';
import {isPublished} from 'apps/archive/utils';
import _, {cloneDeep} from 'lodash';
import {AuthoringWorkspaceService} from '../authoring/services/AuthoringWorkspaceService';

MultieditService.$inject = ['storage', 'superdesk', 'authoringWorkspace', 'referrer', '$location'];
function MultieditService(storage, superdesk, authoringWorkspace: AuthoringWorkspaceService, referrer, $location) {
    // 1. Service manages multiedit screen
    // 2. Screen has it's boards, at least 2 of them
    // 3. Every board can be popuplated with one content item

    var MIN_BOARDS = 2;
    var STORAGE_KEY = 'multiedit';

    var saved = storage.getItem(STORAGE_KEY);

    this.items = saved === null ? [] : saved;

    this.minBoards = function() {
        return MIN_BOARDS;
    };

    this.create = function(_ids) {
        var self = this;

        self.items = [];

        if (_ids) {
            _.each(_ids, (_id) => {
                self.items.push(createBoard(_id));
            });
        }
        if (self.items.length < MIN_BOARDS) {
            for (var i = 0; i < MIN_BOARDS - self.items.length; i++) {
                self.items.push(createBoard(null));
            }
        }

        self.updateItems();
        self.open();
    };

    this.exit = function(item) {
        this.items = [];
        this.updateItems();
        $location.url(referrer.getReferrerUrl());
    };

    this.open = function() {
        if (authoringWorkspace.getState()) {
            authoringWorkspace.close(true);
        }
        referrer.setReferrerUrl($location.url());
        superdesk.intent('author', 'multiedit');
    };

    this.updateItems = function() {
        storage.setItem(STORAGE_KEY, this.items);
    };

    this.edit = function(_id, board) {
        if (!this.items[board]) {
            this.items[board] = createBoard(_id);
        } else {
            this.items[board].article = _id;
        }
        this.updateItems();
    };

    this.remove = function(_id) {
        _.extend(_.find(this.items, {article: _id}), {article: null});
        this.updateItems();
    };

    this.close = function(board) {
        if (this.items.length > MIN_BOARDS) {
            this.items.splice(board, 1);
            this.updateItems();
        }
    };

    function createBoard(_id) {
        return {article: _id};
    }
}

MultieditController.$inject = ['$scope', 'multiEdit'];
function MultieditController($scope, multiEdit) {
    $scope.$watch(() => multiEdit.items, (items) => {
        $scope.boards = items;
    });

    $scope.minBoards = multiEdit.minBoards();

    $scope.closeBoard = function(board) {
        multiEdit.close(board);
    };

    $scope.closeMulti = function() {
        multiEdit.exit();
    };
}

MultieditDropdownDirective.$inject = ['workqueue', 'multiEdit', '$route'];
function MultieditDropdownDirective(workqueue, multiEdit, $route) {
    return {
        templateUrl: 'scripts/apps/authoring/multiedit/views/sd-multiedit-dropdown.html',
        link: function(scope) {
            scope.current = $route.current.params.item;
            scope.queue = [scope.current];

            scope.$watch(() => workqueue.items, (items) => {
                scope.items = items;
            });

            scope.toggle = function(_id) {
                if (_id === scope.current) {
                    return false;
                }
                if (scope.selected(_id)) {
                    scope.queue = _.without(scope.queue, _id);
                } else {
                    scope.queue.push(_id);
                }
            };

            scope.selected = function(_id) {
                return _.indexOf(scope.queue, _id) !== -1;
            };

            scope.open = function() {
                multiEdit.create(scope.queue);
            };
        },
    };
}

MultieditDropdownInnerDirective.$inject = ['workqueue', 'multiEdit'];
function MultieditDropdownInnerDirective(workqueue, multiEdit) {
    return {
        templateUrl: 'scripts/apps/authoring/multiedit/views/sd-multiedit-inner-dropdown.html',
        link: function(scope, elem, attrs) {
            var workqueueItems = [],
                multieditItems = [];

            scope.$watch(() => multiEdit.items, (items) => {
                multieditItems = _.map(multiEdit.items, (board) => board.article);
                filter();
            }, true);

            scope.$watch(() => workqueue.items, (items) => {
                workqueueItems = items;
                filter();
            });

            function filter() {
                scope.items = _.filter(workqueueItems, (item) => _.indexOf(multieditItems, item._id) === -1);
            }

            scope.open = function(_id) {
                multiEdit.edit(_id, attrs.board);
            };
        },
    };
}

MultieditArticleDirective.$inject = ['authoring', 'content', 'multiEdit', 'lock', '$timeout'];
function MultieditArticleDirective(authoring, content, multiEdit, lock, $timeout) {
    return {
        templateUrl: 'scripts/apps/authoring/multiedit/views/sd-multiedit-article.html',
        scope: {article: '=', focus: '='},
        link: function(scope, elem) {
            scope.$watch('article', (newVal, oldVal) => {
                if (newVal && newVal !== oldVal) {
                    openItem();
                }
            });

            function openItem() {
                authoring.open(scope.article).then((item) => {
                    scope.origItem = item;
                    scope.item = JSON.parse(JSON.stringify(item));
                    scope._editable = authoring.isEditable(item);
                    scope.isMediaType = _.includes(['audio', 'video', 'picture', 'graphic'], scope.item.type);

                    if (scope.focus) {
                        $timeout(() => {
                            elem.children().focus();
                        }, 0, false);
                    }
                    scope.isLocked = lock.isLocked(item);

                    content.setupAuthoring(scope.item.profile, scope, scope.item);
                });
            }

            openItem();

            scope.autosave = function(item) {
                scope.dirty = true;
                authoring.autosave(cloneDeep(item), scope.origItem);
            };

            scope.$watch('item.flags', (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    scope.item.flags = newValue;
                    scope.origItem.flags = oldValue;
                }
            }, true);

            scope.save = function(item) {
                return authoring.save(scope.origItem, cloneDeep(item)).then((res) => {
                    scope.dirty = false;

                    return res;
                });
            };

            scope.remove = function(item) {
                multiEdit.remove(item._id);
            };

            scope.isPublished = function(item) {
                if (!_.isNil(item)) {
                    return isPublished(item);
                }
            };
        },
    };
}

MultieditFloatMenuDirective.$inject = ['$document'];
function MultieditFloatMenuDirective($document) {
    return {
        link: function(scope, elem) {
            var open = false;

            elem.bind('click', (event) => {
                if (!open) {
                    event.preventDefault();
                    event.stopPropagation();
                    $('#multiedit-float')
                        .css(getPosition(event.pageX, event.pageY))
                        .show();
                } else {
                    $('#multiedit-float').hide();
                }
                open = !open;
            });

            $document.bind('click', closeOnClick);

            scope.$on('$destroy', () => {
                $document.unbind('click', closeOnClick);
                elem.unbind('click');
            });

            function closeOnClick() {
                open = false;
                $('#multiedit-float').hide();
            }

            function getPosition(crdL, crdT) {
                var docHeight = $document.height();
                var docWidth = $document.width();
                var position: any = {
                    right: docWidth - crdL,
                };

                if (docHeight - crdT < 400) {
                    position.bottom = docHeight - crdT;
                    position.top = 'auto';
                } else {
                    position.top = crdT;
                    position.bottom = 'auto';
                }
                return position;
            }
        },
    };
}

angular.module('superdesk.apps.authoring.multiedit', ['superdesk.core.activity', 'superdesk.apps.authoring'])
    .service('multiEdit', MultieditService)
    .directive('sdMultieditDropdown', MultieditDropdownDirective)
    .directive('sdMultieditInnerDropdown', MultieditDropdownInnerDirective)
    .directive('sdMultieditArticle', MultieditArticleDirective)
    .directive('sdMultieditFloatMenu', MultieditFloatMenuDirective)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('multiedit', {
                category: '/authoring',
                href: '/multiedit',
                when: '/multiedit',
                label: gettext('Authoring'),
                templateUrl: 'scripts/apps/authoring/multiedit/views/multiedit.html',
                topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                controller: MultieditController,
                filters: [{action: 'author', type: 'multiedit'}],
            });
    }]);
