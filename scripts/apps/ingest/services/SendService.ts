import _ from 'lodash';
import {gettext} from 'core/utils';

SendService.$inject = ['desks', 'api', '$q', 'notify', '$injector', 'multi', '$rootScope'];
export function SendService(desks, api, $q, notify, $injector, multi, $rootScope) {
    this.one = sendOne;
    this.all = sendAll;

    this.oneAs = sendOneAs;
    this.allAs = sendAllAs;

    this.config = null;
    this.getConfig = getConfig;
    this.startConfig = startConfig;
    this.getItemsFromPackages = getItemsFromPackages;

    var self = this;

    /**
     * Send given item to a current user desk
     *
     * @param {Object} item
     * @returns {Promise}
     */
    function sendOne(item) {
        if (item._type === 'ingest') {
            return api
                .save('fetch', {}, {desk: desks.getCurrentDeskId()}, item)
                .then(
                    (archiveItem) => {
                        item.task_id = archiveItem.task_id;
                        item.archived = archiveItem._created;
                        multi.reset();
                        return archiveItem;
                    }, (response) => {
                        var message = 'Failed to fetch the item';

                        if (angular.isDefined(response.data._message)) {
                            message = message + ': ' + response.data._message;
                        }
                        notify.error(gettext(message));
                        item.error = response;
                    }
                )
                .finally(() => {
                    if (item.actioning) {
                        item.actioning.archive = false;
                    }
                });
        } else if (item._type === 'externalsource') {
            return api
                .save(item.fetch_endpoint, {
                    guid: item.guid,
                    desk: desks.getCurrentDeskId(),
                }, null, null, {repo: item.ingest_provider})
                .then(
                    (fetched) => {
                        notify.success(gettext('Item Fetched.'));
                        return fetched;
                    }, (error) => {
                        item.error = error;
                        notify.error(gettext('Failed to get item.'));
                        return item;
                    }
                )
                .finally(() => {
                    if (item.actioning) {
                        item.actioning.externalsource = false;
                    }
                });
        }
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
     * @param {string} action - name of the original action
     * @returns {Promise}
     */
    function sendOneAs(item, config, action) {
        var data: any = getData(config);

        if (item._type === 'ingest') {
            return api.save('fetch', {}, data, item).then((archived) => {
                item.archived = archived._created;
                if (config.open) {
                    $injector.get('authoringWorkspace').edit(archived);
                }
                return archived;
            });
        } else if (action && action === 'duplicateTo') {
            return api.save('duplicate', {},
                {desk: data.desk, stage: data.stage, type: item._type, item_id: item.item_id}, item)
                .then((duplicate) => {
                    $rootScope.$broadcast('item:duplicate');
                    notify.success(gettext('Item Duplicated'));
                    if (config.open) {
                        $injector.get('authoringWorkspace').edit({_id: duplicate._id}, 'edit');
                    }
                    return duplicate;
                }, (response) => {
                    var message = 'Failed to duplicate the item';

                    if (angular.isDefined(response.data._message)) {
                        message = message + ': ' + response.data._message;
                    }
                    notify.error(gettext(message));
                    item.error = response;
                });
        } else if (action && action === 'externalsourceTo') {
            return api.save(item.fetch_endpoint, {
                guid: item.guid,
                desk: data.desk,
                stage: data.stage,
            }, null, null, {repo: item.ingest_provider})
                .then((fetched) => {
                    notify.success(gettext('Item Fetched.'));
                    if (config.open) {
                        $injector.get('authoringWorkspace').edit({_id: fetched._id}, 'edit');
                    }
                    return fetched;
                }, (error) => {
                    item.error = error;
                    notify.error(gettext('Failed to get item.'));
                    return item;
                });
        } else if (!item.lock_user) {
            return api.save('move', {}, {task: data, allPackageItems: config.sendAllPackageItems}, item)
                .then((item) => {
                    $rootScope.$broadcast('item:update', {item: item});
                    if (config.open) {
                        $injector.get('authoringWorkspace').edit(item);
                    }
                    return item;
                });
        }

        function getData(config: any) {
            var data: any = {
                desk: config.desk,
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

    function getItemsFromPackages(packages) {
        let items = [];

        (packages || []).forEach((packageItem) => {
            (packageItem.groups || [])
                .filter((group) => group.id !== 'root')
                .forEach((group) => {
                    group.refs.forEach((item) => items.push(item.residRef));
                });
        });
        return items;
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
    function sendAllAs(items, action) {
        self.config = $q.defer();
        self.config.action = action;
        self.config.itemIds = _.map(items, '_id');
        self.config.isPackage = items.some((item) => item.type === 'composite');

        if (self.config.isPackage) {
            self.config.packageItemIds = getItemsFromPackages(items);
        }

        return self.config.promise.then((config) => {
            self.config = null;
            multi.reset();
            return $q.all(items.map((item) => sendOneAs(item, config, action)));
        }, () => {
            self.config = null;
            multi.reset();
        });
    }

    /**
     * Get deffered config if any. Used in $watch
     *
     * @returns {Object|null}
     */
    function getConfig() {
        return self.config;
    }

    /**
     * reset deffered config if any.
     */
    function resetConfig() {
        if (self.config) {
            self.config.reject();
            self.config = null;
        }
    }

    /**
     * Start config via send item sidebar
     *
     * @return {Promise}
     */
    function startConfig() {
        resetConfig();

        self.config = $q.defer();
        return self.config.promise.then((val) => {
            self.config = null;
            return val;
        });
    }
}
