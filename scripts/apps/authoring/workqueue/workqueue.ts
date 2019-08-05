import {IArticle} from 'superdesk-api';
import {find, each, without, keys, includes, get} from 'lodash';
import {getGenericErrorMessage} from 'core/ui/constants';
import {AuthoringWorkspaceService} from '../authoring/services/AuthoringWorkspaceService';

/**
 * This file is part of Superdesk.
 *
 * Copyright 2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

class WorkqueueService {
    items: Array<IArticle>;

    // injected
    session: any;
    api: any;

    constructor(session, api) {
        this.items = [];

        this.session = session;
        this.api = api;
    }

    /**
     * Get all items locked by current user
     */
    fetch() {
        return this.session.getIdentity()
            .then(angular.bind(this, function(identity) {
                const query = {
                    source: {
                        query: {
                            bool: {
                                must: [
                                    {term: {lock_user: identity._id}},
                                    {terms: {lock_action: ['edit', 'correct', 'kill']}},
                                ],
                            },
                        },
                    },
                    auto: 1,
                };

                return this.api.query('workqueue', query)
                    .then(angular.bind(this, function(res) {
                        this.items = null;
                        this.items = res._items || [];
                        return this.items;
                    }));
            }));
    }

    /**
     * Update given item
     */
    updateItem(itemId) {
        var old = find(this.items, {_id: itemId});

        if (old) {
            return this.api.find('archive', itemId).then((item) => angular.extend(old, item));
        }
    }
}

WorkqueueService.$inject = ['session', 'api'];

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
    'referrer',
    'notify',
];
function WorkqueueCtrl($scope, $rootScope, $route, workqueue, authoringWorkspace: AuthoringWorkspaceService, multiEdit,
    lock, $location, session, authoring, autosave, confirm, referrer, notify) {
    $scope.active = null;
    $scope.workqueue = workqueue;
    $scope.multiEdit = multiEdit;

    $scope.$on('content:update', (_e, data) => {
        // only update the workqueue for content:update items in the workqueue
        if (data && data.items) {
            var updateItems = keys(data.items);

            if (updateItems.length) {
                var item = find(workqueue.items, (_item) => includes(updateItems, _item._id));

                if (item) {
                    updateWorkqueue();
                }
            }
        }
    });
    $scope.$on('item:lock', (_e, data) => {
        // Update Workqueue only if the user has locked an item.
        if (data && data.user === session.identity._id) {
            updateWorkqueue(_e, data);
        }
    });
    $scope.$on('item:unlock', (_e, data) => {
        var item: IArticle = workqueue.items.find((_item) => _item._id === data.item);

        if (item && lock.isLocked(item) && session.sessionId !== data.lock_session && $scope.active !== item) {
            authoring.unlock(item, data.user, item.headline);
        }

        if (item && item.linked_in_packages) {
            each(item.linked_in_packages, (_item) => {
                var pck = find(workqueue.items, {_id: _item.package});

                if (pck) {
                    authoringWorkspace.edit(pck);
                }
            });
        }

        if (item) {
            updateWorkqueue();
        }
    });

    $scope.$on('media_archive', (e, data) => {
        workqueue.updateItem(data.item);
    });

    updateWorkqueue();

    /**
     * Update list of opened items and set one active to currently opened item
     */
    function updateWorkqueue(e?, data?) {
        workqueue.fetch().then(() => {
            var route = $route.current || {_id: null, params: {}};

            $scope.isMultiedit = route._id === 'multiedit';
            $scope.active = null;

            let currentItemId = data && data.item ? data.item : route.params.item;

            if (currentItemId) {
                $scope.active = find(workqueue.items, {_id: currentItemId});
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
            .then((result) => confirm.reopen())
            .then((reopen) => {
                _reOpenItem(item);
            }, (err) => {
                if (angular.isDefined(err)) {
                    // confirm dirty checking for current item just incase if it's before autosaved.
                    if (confirm.dirty && $scope.active && $scope.active._id === item._id) {
                        return confirm.reopen().then((reopen) => {
                            _reOpenItem(item);
                        });
                    }
                }
                _closeItem(item);
            });
    };

    function _reOpenItem(item) {
        if ($scope.active && $scope.active._id !== item._id || !$scope.active && item) {
            authoringWorkspace.edit(item);
            $scope.active = item;
        }
        $scope.dashboardActive = false;
    }

    function _closeItem(item) {
        lock.unlock(item)
            .then(() => {
                if (authoringWorkspace.item && item._id === authoringWorkspace.item._id) {
                    authoringWorkspace.close(true);
                }

                multiEdit.items = without(multiEdit.items, find(multiEdit.items, {article: item._id}));
                if (multiEdit.items.length === 0) {
                    $scope.redirectOnCloseMulti();
                }
            })
            .catch((err) => {
                const message = get(err, 'data._message') || getGenericErrorMessage();

                notify.error(message);
            });
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
        if (this.isMultiedit) {
            this.isMultiedit = false;
            $location.url(referrer.getReferrerUrl());
        }
    };

    /*
     * Open article for edit
     */
    $scope.edit = function(item, event) {
        if (!event.ctrlKey) {
            $scope.active = item;
            authoringWorkspace.edit(item, item.lock_action);
            $scope.redirectOnCloseMulti();
            $scope.dashboardActive = false;

            event.preventDefault();
        }
    };

    /**
     * Get relative path to article
     */
    $scope.link = function(item) {
        if (item) {
            return $rootScope.link('authoring', item);
        }
    };
}

function WorkqueueListDirective() {
    return {
        templateUrl: 'scripts/apps/authoring/views/opened-articles.html',
        controller: 'Workqueue',
    };
}

function ArticleDashboardDirective() {
    return {
        templateUrl: 'scripts/apps/authoring/views/dashboard-articles.html',
        scope: {
            closeDashboard: '&closeDashboard',
            _edit: '&edit',
            _closeItem: '&closeItem',
            _link: '&link',
            active: '=active',
            items: '=items',
        },
        link: function(scope, elem, attrs) {
            scope.closeItem = function(item) {
                scope._closeItem({item: item});
            };

            scope.edit = function(item, event) {
                scope._edit({item: item, event: event});
            };

            scope.link = function(item) {
                scope._link({item: item});
            };
        },
    };
}

angular.module('superdesk.apps.authoring.workqueue', [
    'superdesk.core.activity',
    'superdesk.apps.notification',
    'superdesk.apps.authoring.multiedit',
    'superdesk.apps.authoring.compare_versions',
])
    .service('workqueue', WorkqueueService)
    .controller('Workqueue', WorkqueueCtrl)
    .directive('sdWorkqueue', WorkqueueListDirective)
    .directive('sdDashboardArticles', ArticleDashboardDirective);
