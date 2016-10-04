GroupsFactory.$inject = ['$q', 'api', 'storage', 'userList'];
export function GroupsFactory($q, api, storage, userList) {
    var groupsService = {
        groups: null,
        users: null,
        groupLookup: {},
        userLookup: {},
        groupMembers: {},
        loading: null,
        fetchGroups: function() {
            var self = this;

            return api.groups.query({max_results: 500})
            .then(function(result) {
                self.groups = result;
                _.each(result._items, function(group) {
                    self.groupLookup[group._id] = group;
                });
            });
        },
        fetchUsers: function() {
            var self = this;

            return userList.get(null, 1, 500)
            .then(function(result) {
                self.users = result;
                _.each(result._items, function(user) {
                    self.userLookup[user._id] = user;
                });
            });
        },
        generateGroupMembers: function() {
            var self = this;

            _.each(this.groups._items, function(group) {
                self.groupMembers[group._id] = [];
                _.each(group.members, function(member, index) {
                    var user = _.find(self.users._items, {_id: member.user});
                    if (user) {
                        self.groupMembers[group._id].push(user);
                    }
                });
            });

            return $q.when();
        },
        fetchUserGroups: function(user) {
            return api.users.getByUrl(user._links.self.href + '/groups');
        },
        getCurrentGroupId: function() {
            return storage.getItem('groups:currentGroupId') || null;
        },
        setCurrentGroupId: function(groupId) {
            storage.setItem('groups:currentGroupId', groupId);
        },
        fetchCurrentGroup: function() {
            return api.groups.getById(this.getCurrentGroupId());
        },
        setCurrentGroup: function(group) {
            this.setCurrentGroupId(group ? group._id : null);
        },
        getCurrentGroup: function(group) {
            return this.groupLookup[this.getCurrentGroupId()];
        },
        initialize: function() {
            if (!this.loading) {
                this.loading = this.fetchGroups()
                    .then(angular.bind(this, this.fetchUsers))
                    .then(angular.bind(this, this.generateGroupMembers));
            }

            return this.loading;
        }
    };
    return groupsService;
}
