UserMentioDirective.$inject = ['userList', 'desks', 'asset', '$q'];
export function UserMentioDirective(userList, desks, asset, $q) {
    return {
        templateUrl: asset.templateUrl('apps/users/views/mentions.html'),
        link: function(scope, elem) {
            scope.users = [];
            scope.fetching = false;
            scope.prefix = '';
            var fetchedPages = [];

            var container = elem.children()[0];
            elem.children().bind('scroll', function() {
                if (container.scrollTop + container.offsetHeight >= container.scrollHeight - 3) {
                    container.scrollTop = container.scrollTop - 3;
                    scope.fetchNext();
                }
            });

            // Calculates the next page and calls fetchItems for new items
            scope.fetchNext = function() {
                var page = scope.users.length / 10 + 1;
                fetchItems(scope.prefix, page);
            };

            // Returns the next set of results
            function fetchItems(prefix, page) {
                if (!scope.fetching && !_.includes(fetchedPages, page)) {
                    var promises = [];
                    scope.fetching = true;

                    promises.push(getFilteredUsers(prefix, scope.users, page));
                    promises.push(getFilteredDesks(scope.prefix, scope.users, page));

                    $q.all(promises).then(function() {
                        scope.users = _.sortBy(scope.users, function(item) {
                            return item.type === 'user' ?
                                item.item.username.toLowerCase()
                                : item.item.name.toLowerCase();
                        });

                        scope.fetching = false;
                        fetchedPages.push(page);
                    });
                }
            }

            // Returns the next set of users
            function getFilteredUsers(prefix, list, page) {
                return userList.get(prefix, page, 10).then(function(result) {
                    var filteredUsers = result._items.slice((page - 1) * 10, page * 10);
                    _.each(filteredUsers, function(user) {
                        list.push({'type': 'user', 'item': user});
                    });
                });
            }

            // Returns the next set of desks
            function getFilteredDesks(prefix, list, page) {
                return desks.initialize().then(function() {
                    var filteredDesks = desks.desks._items;
                    if (scope.prefix) {
                        filteredDesks = _.filter(desks.desks._items, function(item) {
                            return _.startsWith(item.name.toLowerCase(), prefix.toLowerCase());
                        });
                    }

                    if (page) {
                        filteredDesks = filteredDesks.slice((page - 1) * 10, page * 10);
                    }

                    _.each(filteredDesks, function(item) {
                        list.push({'type': 'desk', 'item': item});
                    });
                });
            }

            // filter user by given prefix
            scope.searchUsersAndDesks = function(prefix) {
                scope.prefix = prefix;
                scope.users = [];
                fetchedPages = [];
                fetchItems(scope.prefix, 1);
            };

            scope.select = function(item) {
                return item.type === 'user' ? '@' + item.item.username : '#' + item.item.name.replace(' ', '_');
            };

            scope.$watchCollection(
                function() {
                    return $('.users-list-embed>li.active');
                },
                function(newValue) {
                    if (newValue.hasClass('active')) {
                        $('.mentio-menu').scrollTop(newValue.position().top);
                    }
                }
            );
        }
    };
}
