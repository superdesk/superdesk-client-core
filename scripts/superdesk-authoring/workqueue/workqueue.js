/**
 * This file is part of Superdesk.
 *
 * Copyright 2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
(function() {

'use strict';

WorkqueueService.$inject = ['session', 'api'];
function WorkqueueService(session, api) {

    this.items = [];

    /**
     * Get all items locked by current user
     */
    this.fetch = function() {
        return session.getIdentity()
            .then(angular.bind(this, function(identity) {
                return api.query('workqueue', {source: {filter: {term: {lock_user: identity._id}}}})
                    .then(angular.bind(this, function(res) {
                        this.items = null;
                        this.items = res._items || [];
                        return this.items;
                    }));
            }));
    };

    /**
     * Update given item
     */
    this.updateItem = function(itemId) {
        var old = _.find(this.items, {_id: itemId});
        if (old) {
            return api.find('archive', itemId).then(function(item) {
                return angular.extend(old, item);
            });
        }
    };
}

WorkqueueCtrl.$inject = [
    '$scope',
    '$rootScope',
    '$route',
    'workqueue',
    'authoringWorkspace',
    'multiEdit',
    'lock',
    '$location',
    'session',
    'authoring',
    'autosave',
    'confirm',
    'notify',
    'referrer'
];
function WorkqueueCtrl($scope, $rootScope, $route, workqueue, authoringWorkspace, multiEdit,
        lock, $location, session, authoring, autosave, confirm, notify, referrer) {

    $scope.active = null;
    $scope.workqueue = workqueue;
    $scope.multiEdit = multiEdit;

    $scope.$on('content:update', function (_e, data) {
        // only update the workqueue for content:update items in the workqueue
        if (data && data.items) {
            var updateItems = _.keys(data.items);
            if (updateItems.length) {
                var item = _.find(workqueue.items, function(item) {
                    return _.includes(updateItems, item._id);
                });

                if (item) {
                    updateWorkqueue();
                }
            }
        }
    });
    $scope.$on('item:lock', function(_e, data) {
        // Update Workqueue only if the user has locked an item.
        if (data && data.user === session.identity._id) {
            updateWorkqueue();
        }
    });
    $scope.$on('item:unlock', function (_e, data) {
        var item = _.find(workqueue.items, {_id: data.item});
        if (item && lock.isLocked(item) && session.sessionId !== data.lock_session && $scope.active !== item) {
            authoring.unlock(item, data.user, item.headline);
        }

        if (item && item.linked_in_packages) {
            _.each(item.linked_in_packages, function(item) {
                var pck = _.find(workqueue.items, {_id: item.package});
                if (pck) {
                    authoringWorkspace.edit(pck);
                }
            });
        }

        if (item) {
            updateWorkqueue();
        }
    });

    $scope.$on('media_archive', function(e, data) {
        workqueue.updateItem(data.item);
    });

    updateWorkqueue();

    /**
     * Update list of opened items and set one active if its id is in current route path.
     */
    function updateWorkqueue() {
        workqueue.fetch().then(function() {
            var route = $route.current || {_id: null, params: {}};
            $scope.isMultiedit = route._id === 'multiedit';
            $scope.active = null;
            if (route.params.item) {
                $scope.active = _.find(workqueue.items, {_id: route.params.item});
            }
        });
    }

    $scope.openDashboard = function() {
        $scope.dashboardActive = true;
    };

    $scope.closeDashboard = function() {
        $scope.dashboardActive = false;
    };

    /**
     * Closes item. If item is opened, close authoring workspace.
     * Updates multiedit items, if item is part of multiedit.
     * When closing last item that was in multiedit(no more items in multiedit), redirects to monitoring.
     * if there autosave version then open dialog to prompt the user to save.
     */
    $scope.closeItem = function(item) {
        autosave.get(item)
            .then(function(result) {
                return confirm.reopen();
            })
            .then(function(reopen) {
                _reOpenItem(item);
            }, function(err) {
                if (angular.isDefined(err)) {
                    // confirm dirty checking for current item just incase if it's before autosaved.
                    if (confirm.dirty && $scope.active && $scope.active._id === item._id) {
                        return confirm.reopen().then(function(reopen) {
                            _reOpenItem(item);
                        });
                    }
                }
                _closeItem(item);
            });
    };

    function _reOpenItem(item) {
        if (($scope.active && $scope.active._id !== item._id) || (!$scope.active && item)) {
            authoringWorkspace.edit(item);
        } else {
            notify.success(gettext('Item already open.'));
        }
    }

    function _closeItem(item) {
        lock.unlock(item);
        if (authoringWorkspace.item && item._id === authoringWorkspace.item._id){
            authoringWorkspace.close(true);
        }

        multiEdit.items = _.without(multiEdit.items, _.find(multiEdit.items, {article: item._id}));
        if (multiEdit.items.length === 0){
            $scope.redirectOnCloseMulti();
        }
    }

    $scope.openMulti = function() {
        $scope.isMultiedit = true;
        updateWorkqueue();
        multiEdit.open();
    };

    /**
     * Close multiedit.
     */
    $scope.closeMulti = function() {
        multiEdit.exit();
        $scope.redirectOnCloseMulti();
    };

    /**
     * If multi edit screen is opened, redirect to monitoring.
     */
    $scope.redirectOnCloseMulti = function() {
        if (this.isMultiedit){
            this.isMultiedit = false;
            $location.url(referrer.getReferrerUrl());
        }
    };

    /*
     * Open article for edit
     */
    $scope.edit = function (item, event) {
        if (!event.ctrlKey) {
            $scope.active = item;
            authoringWorkspace.edit(item);
            $scope.redirectOnCloseMulti();
            $scope.dashboardActive = false;

            event.preventDefault();
        }
    };

    /**
     * Get relative path to article
     */
    $scope.link = function (item) {
        if (item) {
            return $rootScope.link('authoring', item);
        }
    };
}

function WorkqueueListDirective() {
    return {
        templateUrl: 'scripts/superdesk-authoring/views/opened-articles.html',
        controller: 'Workqueue'
    };
}

function ArticleDashboardDirective() {
    return {
        templateUrl: 'scripts/superdesk-authoring/views/dashboard-articles.html',
        scope: {
            closeDashboard: '&closeDashboard',
            _edit: '&edit',
            _closeItem: '&closeItem',
            _link: '&link',
            active: '=active',
            items:'=items'
        },
        link: function (scope, elem, attrs) {
            scope.closeItem = function(item) {
                scope._closeItem({'item': item});
            };

            scope.edit = function(item, event) {
                scope._edit({'item': item, 'event': event});
            };

            scope.link = function(item) {
                scope._link({'item': item});
            };
        }
    };
}

angular.module('superdesk.authoring.workqueue', [
    'superdesk.activity',
    'superdesk.notification',
    'superdesk.authoring.multiedit'
])
    .service('workqueue', WorkqueueService)
    .controller('Workqueue', WorkqueueCtrl)
    .directive('sdWorkqueue', WorkqueueListDirective)
    .directive('sdDashboardArticles', ArticleDashboardDirective);
})();
