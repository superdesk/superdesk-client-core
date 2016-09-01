DesksFactory.$inject = ['$q', 'api', 'preferencesService', 'userList', 'notify', 'session', '$filter'];
export function DesksFactory($q, api, preferencesService, userList, notify, session, $filter) {
    var userDesks, userDesksPromise;

    var _fetchAll = function(endpoint, page, items) {
        page = page || 1;
        items = items || [];

        return api.query(endpoint, {max_results: 200, page: page})
        .then(function(result) {
            items = items.concat(result._items);
            if (result._links.next) {
                page++;
                return _fetchAll(endpoint, page, items);
            }
            return items;
        });
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
            stage: desks.activeStageId
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
            .then(function(items) {
                items = $filter('sortByName')(items);

                self.desks = {_items: items};
                _.each(items, function(item) {
                    self.deskLookup[item._id] = item;
                });
                return self.desks;
            });
        },

        fetchUsers: function() {
            var self = this;
            return userList.getAll()
            .then(function(result) {
                self.users = {};
                self.users._items = result;
                _.each(result, function(user) {
                    self.userLookup[user._id] = user;
                });
            });
        },
        fetchStages: function() {
            var self = this;

            return _fetchAll('stages')
            .then(function(items) {
                self.stages = {_items: items};
                _.each(items, function(item) {
                    self.stageLookup[item._id] = item;
                });
            });
        },
        fetchDeskStages: function(desk, refresh) {
            var self = this;

            if (self.deskStages[desk] && !refresh) {
                return $q.when().then(returnDeskStages);
            } else {
                return self.fetchStages()
                    .then(angular.bind(self, self.generateDeskStages))
                    .then(returnDeskStages);
            }

            function returnDeskStages() {
                return self.deskStages[desk];
            }
        },
        generateDeskMembers: function() {
            var self = this;

            _.each(this.desks._items, function(desk) {
                self.deskMembers[desk._id] = [];
                _.each(desk.members, function(member, index) {
                    var user = _.find(self.users._items, {_id: member.user});
                    if (user) {
                        self.deskMembers[desk._id].push(user);
                    } else {
                        console.error('Desk user not found for desk: %s , user missing: %s', desk.name, member.user);
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
            return api.get(user._links.self.href + '/desks').then(function(response) {
                if (response && response._items) {
                    response._items = $filter('sortByName')(response._items);
                }

                return $q.when(response);
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

            return preferencesService.get('desk:last_worked').then(function(result) {
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

            return preferencesService.get('stage:items').then(function(result) {
                if (angular.isDefined(result)) {
                    self.activeStageId = angular.isArray(result) ? result[0] : result;
                }
            });
        },
        getCurrentDeskId: function() {
            if (!this.userDesks || !this.userDesks._items || this.userDesks._items.length === 0) {
                return null;
            }
            if (!this.activeDeskId || !_.find(this.userDesks._items, {_id: this.activeDeskId})) {
                if (session.identity.desk) {
                    var defaultDesk = _.find(this.userDesks._items, {_id: session.identity.desk});
                    return (defaultDesk && defaultDesk._id) || this.userDesks._items[0]._id;
                }
                return this.userDesks._items[0]._id;
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
                    'stage:items': []
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
                    'stage:items': [this.activeStageId]
                }, 'desk:last_worked');
            }
        },
        fetchDeskById: function(Id) {
            return api.desks.getById(Id);
        },
        getCurrentDesk: function() {
            return this.deskLookup[this.getCurrentDeskId()] || null;
        },
        setWorkspace: function(deskId, stageId) {
            deskId = deskId || null;
            stageId = stageId || null;
            if (this.activeDeskId !== deskId || this.activeStageId !== stageId) {
                this.activeDeskId = deskId;
                this.activeStageId = stageId;
                setActive(this);
                preferencesService.update({
                    'desk:last_worked': this.activeDeskId,
                    'stage:items': [this.activeStageId]
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
                .then(reset);
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
        }
    };

    return desksService;

    function reset(res) {
        userDesks = null;
        userDesksPromise = null;
        desksService.loading = null;
        return res;
    }
}
