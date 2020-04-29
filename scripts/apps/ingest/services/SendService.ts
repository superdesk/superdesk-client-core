import _ from 'lodash';
import {gettext} from 'core/utils';
import {showModal} from 'core/services/modalService';
import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {fileUploadErrorModal} from '../../archive/controllers/file-upload-error-modal';

SendService.$inject = ['desks', 'api', '$q', 'notify', 'multi', '$rootScope', '$injector'];
export function SendService(
    desks,
    api,
    $q,
    notify,
    multi,
    $rootScope,
    $injector,
) {
    this.one = sendOne;
    this.validateAndSend = validateAndSend;
    this.all = sendAll;

    this.oneAs = sendOneAs;
    this.allAs = sendAllAs;

    this.config = null;
    this.getConfig = getConfig;
    this.startConfig = startConfig;
    this.getItemsFromPackages = getItemsFromPackages;
    this.getValidItems = getValidItems;

    var self = this;

    // workaround for circular dependencies
    function getAuthoringWorkspace(): AuthoringWorkspaceService {
        return $injector.get('authoringWorkspace');
    }

    function getValidItems(items: Array<IArticle>) {
        const validItems = [];
        const invalidItems = [];

        items.forEach((item) => {
            if (appConfig.pictures && item.type === 'picture' && item._type === 'ingest') {
                const pictureWidth = item?.renditions.original.width;
                const pictureHeight = item?.renditions.original.height;

                if (appConfig.pictures.minWidth > pictureWidth || appConfig.pictures.minHeight > pictureHeight) {
                    invalidItems.push({
                        valid: false,
                        name: item.headline || item.slugline || 'image',
                        width: item.renditions.original.width,
                        height: item.renditions.original.height,
                        type: 'image',
                    });
                } else {
                    validItems.push(item);
                }
            } else {
                validItems.push(item);
            }
        });

        if (invalidItems.length > 0) {
            showModal(fileUploadErrorModal(invalidItems));
        }
        return validItems;
    }

    /**
     * Send given item to a current user desk
     *
     * @param {Object} item
     * @returns {Promise}
     */
    function sendOne(item: IArticle) {
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
                    },
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
                    },
                )
                .finally(() => {
                    if (item.actioning) {
                        item.actioning.externalsource = false;
                    }
                });
        }
    }

    function validateAndSend(item) {
        const validItems = getValidItems([item]);

        if (validItems.length > 0) {
            return sendOne(item);
        } else {
            return $q.reject();
        }
    }

    /**
     * Send all given items to current user desk
     *
     * @param {Array} items
     */
    function sendAll(items) {
        const validItems = getValidItems(items);

        if (validItems.length > 0) {
            return Promise.all(validItems.map(sendOne));
        }
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
                    const authoringWorkspace: AuthoringWorkspaceService = $injector.get('authoringWorkspace');

                    authoringWorkspace.edit(archived);
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
                        getAuthoringWorkspace().edit({_id: duplicate._id}, 'edit');
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
                        getAuthoringWorkspace().edit({_id: fetched._id}, 'edit');
                    }
                    return fetched;
                }, (error) => {
                    item.error = error;
                    notify.error(gettext('Failed to get item.'));
                    return item;
                });
        } else if (!item.lock_user) {
            return api.save('move', {}, {task: data, allPackageItems: config.sendAllPackageItems}, item)
                .then((_item) => {
                    $rootScope.$broadcast('item:update', {item: _item});
                    if (config.open) {
                        getAuthoringWorkspace().edit(_item);
                    }
                    return _item;
                });
        }

        function getData(_config: any) {
            var _data: any = {
                desk: _config.desk,
            };

            if (_config.stage) {
                _data.stage = _config.stage;
            }

            if (_config.macro) {
                _data.macro = _config.macro;
            }

            return _data;
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
        const validItems = getValidItems(items);

        if (validItems.length > 0) {
            self.config = $q.defer();
            self.config.action = action;
            self.config.itemIds = _.map(validItems, '_id');
            self.config.items = validItems;
            self.config.isPackage = validItems.some((_item) => _item.type === 'composite');

            if (self.config.isPackage) {
                self.config.packageItemIds = getItemsFromPackages(validItems);
            }

            return self.config.promise.then((config) => {
                self.config = null;
                multi.reset();
                return $q.all(validItems.map((_item) => sendOneAs(_item, config, action)));
            }, () => {
                self.config = null;
                multi.reset();
            });
        }
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
