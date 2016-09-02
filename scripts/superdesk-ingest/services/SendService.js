SendService.$inject = ['desks', 'api', '$q', 'notify', '$injector', 'multi', '$rootScope'];
export function SendService(desks, api, $q, notify, $injector, multi, $rootScope) {
    this.one = sendOne;
    this.all = sendAll;

    this.oneAs = sendOneAs;
    this.allAs = sendAllAs;

    this.config = null;
    this.getConfig = getConfig;
    this.startConfig = startConfig;

    var vm = this;

    /**
     * Send given item to a current user desk
     *
     * @param {Object} item
     * @returns {Promise}
     */
    function sendOne(item) {
        return api
            .save('fetch', {}, {desk: desks.getCurrentDeskId()}, item)
            .then(
                function(archiveItem) {
                    item.task_id = archiveItem.task_id;
                    item.archived = archiveItem._created;
                    multi.reset();
                    return archiveItem;
                }, function(response) {
                    var message = 'Failed to fetch the item';
                    if (angular.isDefined(response.data._message)) {
                        message = message + ': ' + response.data._message;
                    }
                    notify.error(gettext(message));
                    item.error = response;
                })
            ['finally'](function() {
                if (item.actioning) {
                    item.actioning.archive = false;
                }
            });
    }

    /**
     * Send all given items to current user desk
     *
     * @param {Array} items
     */
    function sendAll(items) {
        angular.forEach(items, sendOne);
    }

    /**
     * Send given item using config
     *
     * @param {Object} item
     * @param {Object} config
     * @param {string} config.desk - desk id
     * @param {string} config.stage - stage id
     * @param {string} config.macro - macro name
     * @returns {Promise}
     */
    function sendOneAs(item, config) {
        var data = getData(config);
        if (item._type === 'ingest') {
            return api.save('fetch', {}, data, item).then(function (archived) {
                item.archived = archived._created;
                if (config.open) {
                    $injector.get('authoringWorkspace').edit(archived);
                }
                return archived;
            });
        } else if (!item.lock_user) {
            return api.save('move', {}, {task: data}, item).then(function (item) {
                $rootScope.$broadcast('item:update', {item: item});
                return item;
            });
        }

        function getData(config) {
            var data = {
                desk: config.desk
            };

            if (config.stage) {
                data.stage = config.stage;
            }

            if (config.macro) {
                data.macro = config.macro;
            }

            return data;
        }
    }

    /**
     * Send all given item using config once it's resolved
     *
     * At first it only creates a deferred config which is
     * picked by SendItem directive, once used sets the destination
     * it gets resolved and items are sent.
     *
     * @param {Array} items
     * @return {Promise}
     */
    function sendAllAs(items) {
        vm.config = $q.defer();
        return vm.config.promise.then(function(config) {
            vm.config = null;
            multi.reset();
            return $q.all(items.map(function(item) {
                return sendOneAs(item, config);
            }));
        });
    }

    /**
     * Get deffered config if any. Used in $watch
     *
     * @returns {Object|null}
     */
    function getConfig() {
        return vm.config;
    }

    /**
     * Start config via send item sidebar
     *
     * @return {Promise}
     */
    function startConfig() {
        vm.config = $q.defer();
        return vm.config.promise.then(function(val) {
            vm.config = null;
            return val;
        });
    }
}
