import * as constant from 'apps/ingest/constants';

IngestUserDashboard.$inject = ['api', 'userList', 'privileges'];
export function IngestUserDashboard (api, userList, privileges) {
    return {
        templateUrl: 'scripts/apps/ingest/views/dashboard/ingest-dashboard-widget.html',
        scope: {
            item: '=',
            setUserPreferences: '&'
        },
        link: function (scope) {

            function getCount() {
                var criteria = {
                    source: {
                        query: {
                            filtered: {
                                filter: {
                                    and: [
                                            {term: {ingest_provider: scope.item._id}},
                                            {range: {versioncreated: {gte: 'now-24h'}}}
                                    ]
                                }
                            }
                        },
                        size: 0,
                        from: 0
                    }
                };

                api.ingest.query(criteria).then(function (result) {
                    scope.ingested_count = result._meta.total;
                });
            }

            function updateProvider() {
                api.ingestProviders.getById(scope.item._id).then(function (result) {
                    angular.extend(scope.item, result);
                    getUser();
                }, function (error) {
                    if (error.status === 404) {
                        scope.item.dashboard_enabled = false;
                        scope.setUserPreferences();
                    }
                });
            }

            function getLogMessages() {
                var criteria = {
                    max_results: 5,
                    sort: '[(\'_created\',-1)]'
                };

                var where = [
                        {resource: 'ingest_providers'},
                        {'data.provider_id': scope.item._id}
                ];

                if (scope.item.log_messages === 'error') {
                    where.push({name: 'error'});
                }

                criteria.where = JSON.stringify ({
                    '$and': where
                });

                api.query('activity', criteria).then(function (result) {
                    scope.log_messages = result._items;
                });
            }

            function refreshItem(data) {
                if (data.provider_id === scope.item._id) {
                    getCount();
                    updateProvider();
                    getLogMessages();
                }
            }

            function getUser() {
                if (scope.item.is_closed && scope.item.last_closed && scope.item.last_closed.closed_by) {
                    userList.getUser(scope.item.last_closed.closed_by).then(function(result) {
                        scope.item.last_closed.display_name = result.display_name;
                    });
                } else if (!scope.item.is_closed && scope.item.last_opened && scope.item.last_opened.opened_by) {
                    userList.getUser(scope.item.last_opened.opened_by).then(function(result) {
                        scope.item.last_opened.display_name = result.display_name;
                    });
                }
            }

            function init() {
                scope.showIngest = Boolean(privileges.privileges.ingest_providers);
                scope.ingested_count = 0;
                getCount();
                getUser();
                getLogMessages();
            }

            init();

            scope.isIdle = function() {
                if (scope.item.last_item_update && !scope.item.is_closed) {
                    var idleTime =  scope.item.idle_time || constant.DEFAULT_IDLE_TIME;
                    var lastItemUpdate = moment(scope.item.last_item_update);
                    if (idleTime && !angular.equals(idleTime, constant.DEFAULT_IDLE_TIME)) {
                        lastItemUpdate.add(idleTime.hours, 'h').add(idleTime.minutes, 'm');
                        if (moment() > lastItemUpdate) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
                return false;
            };

            scope.filterLogMessages = function() {
                scope.setUserPreferences();
                getLogMessages();
            };

            scope.$on('ingest:update', function (evt, extras) {
                refreshItem(extras);
            });

            scope.$on('ingest_provider:update', function (evt, extras) {
                refreshItem(extras);
            });
        }
    };
}
