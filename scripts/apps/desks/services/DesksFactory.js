import _ from 'lodash';
import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc service
 * @module superdesk.apps.desks
 * @name desks
 *
 * @requires $q
 * @requires api
 * @requires preferencesService
 * @requires userList
 * @requires notify
 * @requires session
 * @requires $filter
 * @requires privileges
 *
 * @description Desks Service is responsible for managing desks and stages
 */
DesksFactory.$inject = ['$q', 'api', 'preferencesService', 'userList', 'notify',
    'session', '$filter', 'privileges', '$rootScope'];
export function DesksFactory($q, api, preferencesService, userList, notify,
    session, $filter, privileges, $rootScope) {
    let _cache = {};

    var _fetchAll = function(endpoint, parent, page = 1, items = []) {
        let key;

        if (page === 1) {
            key = angular.toJson({resource: endpoint, parent: parent});
            if (_cache[key]) {
                return _cache[key];
            }
        }

        let promise = api.query(endpoint, {max_results: 200, page: page}, parent)
            .then((result) => {
                let pg = page;
                let extended = items.concat(result._items);

                if (result._links.next) {
                    pg++;
                    return _fetchAll(endpoint, parent, pg, extended);
                }
                return extended;
            });

        if (page === 1) {
            _cache[key] = promise;
        }

        return promise;
    };

    /**
     * Set desks.active which contains both desk and stage
     * refs and is updated only when one of those is changed.
     */
    function setActive(desks) {
        if (desks.active && desks.active.desk === desks.activeDeskId && desks.active.stage === desks.activeStageId) {
            // pass
            return;
        }

        desks.active = {
            desk: desks.activeDeskId,
            stage: desks.activeStageId,
        };
    }

    var desksService = {
        desks: null,
        users: null,
        stages: null,
        deskLookup: {},
        stageLookup: {},
        userLookup: {},
        deskMembers: {},
        deskStages: {},
        loading: null,
        activeDeskId: null,
        activeStageId: null,
        active: {desk: null, stage: null},

        /**
         * @description Fetches all desks in the system.
         * @returns {Promise}
         */
        fetchDesks: function() {
            var self = this;

            return _fetchAll('desks')
                .then((items) => {
                    let byName = $filter('sortByName')(items);

                    self.desks = {_items: byName};
                    _.each(byName, (item) => {
                        self.deskLookup[item._id] = item;
                    });
                    return self.desks;
                });
        },

        fetchUsers: function() {
            var self = this;

            return userList.getAll()
                .then((result) => {
                    self.users = {};
                    self.users._items = result;
                    _.each(result, (user) => {
                        self.userLookup[user._id] = user;
                    });
                });
        },
        fetchStages: function() {
            var self = this;

            return _fetchAll('stages')
                .then((items) => {
                    self.stages = {_items: items};
                    _.each(items, (item) => {
                        self.stageLookup[item._id] = item;
                    });
                });
        },
        fetchDeskStages: function(desk, refresh) {
            var self = this;

            if (self.deskStages[desk] && !refresh) {
                return $q.when().then(returnDeskStages);
            }

            return self.fetchStages()
                .then(angular.bind(self, self.generateDeskStages))
                .then(returnDeskStages);

            function returnDeskStages() {
                return self.deskStages[desk];
            }
        },
        generateDeskMembers: function() {
            var self = this;

            _.each(this.desks._items, (desk) => {
                self.deskMembers[desk._id] = [];
                _.each(desk.members, (member, index) => {
                    var user = _.find(self.users._items, {_id: member.user});

                    if (user) {
                        self.deskMembers[desk._id].push(user);
                    }
                });
            });

            return $q.when();
        },
        generateDeskStages: function() {
            var self = this;

            this.deskStages = _.groupBy(self.stages._items, 'desk');

            return $q.when();
        },
        fetchUserDesks: function(user) {
            return _fetchAll('user_desks', {_id: user._id}).then((response) => {
                if (!response) {
                    return;
                }
                return $q.when($filter('sortByName')(response));
            });
        },

        /**
         * Fetch current user desks and make sure active desk is present in there
         */
        fetchCurrentUserDesks: function() {
            var self = this;

            if (self.userDesks) {
                return $q.when(self.userDesks);
            }

            return this.fetchCurrentDeskId() // make sure there will be current desk
                .then(angular.bind(session, session.getIdentity))
                .then(angular.bind(this, this.fetchUserDesks))
                .then(angular.bind(this, function(desks) {
                    self.userDesks = desks;
                    setActive(this);
                    return desks;
                }));
        },

        fetchCurrentDeskId: function() {
            var self = this;

            if (self.activeDeskId) {
                return $q.when(self.activeDeskId);
            }

            return preferencesService.get('desk:last_worked').then((result) => {
                self.activeDeskId = null;
                if (angular.isDefined(result) && result !== '') {
                    self.activeDeskId = result;
                } else {
                    self.activeDeskId = self.getCurrentDeskId();
                }

                return self.activeDeskId;
            });
        },
        fetchCurrentStageId: function() {
            var self = this;

            if (self.activeStageId) {
                return $q.when(self.activeStageId);
            }

            return preferencesService.get('stage:items').then((result) => {
                if (angular.isDefined(result)) {
                    self.activeStageId = angular.isArray(result) ? result[0] : result;
                }
            });
        },
        getCurrentDeskId: function() {
            if (!this.userDesks || this.userDesks.length === 0) {
                return null;
            }
            if (!this.activeDeskId || !_.find(this.userDesks, {_id: this.activeDeskId})) {
                if (session.identity.desk) {
                    var defaultDesk = _.find(this.userDesks, {_id: session.identity.desk});

                    return defaultDesk && defaultDesk._id || this.userDesks[0]._id;
                }
                return this.userDesks[0]._id;
            }
            return this.activeDeskId;
        },
        setCurrentDeskId: function(deskId) {
            if (this.activeDeskId !== deskId) {
                this.activeDeskId = deskId;
                this.activeStageId = null;
                setActive(this);
                preferencesService.update({
                    'desk:last_worked': this.activeDeskId,
                    'stage:items': [],
                }, 'desk:last_worked');
            }
        },
        getCurrentStageId: function() {
            return this.activeStageId;
        },
        setCurrentStageId: function(stageId) {
            if (this.activeStageId !== stageId) {
                this.activeStageId = stageId;
                setActive(this);
                preferencesService.update({
                    'desk:last_worked': this.activeDeskId,
                    'stage:items': [this.activeStageId],
                }, 'desk:last_worked');
            }
        },
        fetchDeskById: function(Id) {
            return api.desks.getById(Id);
        },
        getCurrentDesk: function() {
            return this.deskLookup[this.getCurrentDeskId()] || null;
        },
        setWorkspace: function(deskId = null, stageId = null) {
            if (this.activeDeskId !== deskId || this.activeStageId !== stageId) {
                this.activeDeskId = deskId;
                this.activeStageId = stageId;
                setActive(this);
                preferencesService.update({
                    'desk:last_worked': this.activeDeskId,
                    'stage:items': [this.activeStageId],
                }, 'desk:last_worked');
            }
        },
        initialize: function() {
            if (!this.loading) {
                this.fetchCurrentDeskId();
                this.fetchCurrentStageId();

                this.loading = this.fetchUsers()
                    .then(angular.bind(this, this.fetchDesks))
                    .then(angular.bind(this, this.generateDeskMembers))
                    .then(angular.bind(this, this.fetchStages))
                    .then(angular.bind(this, this.generateDeskStages))
                    .then(angular.bind(this, this.initActive));
            }

            return this.loading;
        },
        initActive: function() {
            setActive(this);
        },
        save: function(dest, diff) {
            return api.save('desks', dest, diff)
                .then(reset, handleSaveError);
        },
        remove: function(desk) {
            return api.remove(desk)
                .then(reset);
        },
        refreshStages: function() {
            return this.fetchStages().then(angular.bind(this, this.generateDeskStages));
        },
        refreshUsers: function() {
            return this.fetchUsers().then(angular.bind(this, this.generateDeskMembers));
        },
        /**
         * Get current desk for given item
         *
         * @param {Object} item
         */
        getItemDesk: function(item) {
            if (item.task && item.task.desk) {
                return this.deskLookup[item.task.desk] || null;
            }
        },
        isOutputType: function(type) {
            return type === 'deskOutput' || type === 'scheduledDeskOutput';
        },
        isPublishType: function(type) {
            return type === 'deskOutput' || type === 'scheduledDeskOutput' || type === 'highlights';
        },
        isReadOnlyStage: function(stageId) {
            return this.stageLookup[stageId] ? this.stageLookup[stageId].local_readonly : false;
        },
        /**
         * @ngdoc method
         * @name desks#markItem
         * @public
         * @description Toggles the marking for the given story
         * @param {string} deskId
         * @param {Object} markedItem
         * @returns {Object}
         */
        markItem: function(deskId, markedItem) {
            return api.save('marked_for_desks', {marked_desk: deskId, marked_item: markedItem._id});
        },
        /**
         * @ngdoc method
         * @name desks#hasMarkItemPrivilege
         * @public
         * @description Checks if the current user has the privilege
         * for marking stories for desks
         * @returns {boolean}
         */
        hasMarkItemPrivilege: function() {
            return !!privileges.privileges.mark_for_desks;
        },
    };

    $rootScope.$on('desk', reset);
    $rootScope.$on('stage', reset);

    return desksService;

    function reset(res) {
        desksService.loading = null;
        _cache = {};
        return res;
    }

    function handleSaveError(response) {
        if (response.status === 412) {
            notify.error(gettext('Desk has been modified elsewhere. Please reload the desks.'));
        }
        return $q.reject(response);
    }
}
