import _, {flatMap} from 'lodash';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';

import {IExtensionActivationResult} from 'superdesk-api';
import {extensions, appConfig} from 'appConfig';
import {showSpikeDialog} from 'apps/archive/show-spike-dialog';
import ng from 'core/services/ng';
import {confirmPublish} from 'apps/authoring/authoring/services/quick-publish-modal';

export interface IMultiActions {
    send(): void;
    sendAs(): void;
    fetch(fetchAs?: boolean): void;
    canRemoveIngestItems(): boolean;
    removeIngestItems(): void;
    multiedit(): void;
    multiImageEdit(): void;
    createPackage(): void;
    addToPackage(): void;
    spikeItems(): void;
    unspikeItems(): void;
    canEditMetadata(): boolean;
    canPackageItems(): boolean;
    canPublishItem(): boolean;
    duplicateTo(): Promise<any>;
    duplicateInPlace(): void;
    canHighlightItems(): boolean;
    publish(): void;
    deschedule(): void;
}

export function getMultiActions(
    getSelectedItems: () => Array<IArticle>,
    unselectAll: () => void,
) {
    const $location = ng.get('$location');
    const $rootScope = ng.get('$rootScope');
    const api = ng.get('api');
    const authoring = ng.get('authoring');
    const desks = ng.get('desks');
    const lock = ng.get('lock');
    const modal = ng.get('modal');
    const multiEdit = ng.get('multiEdit');
    const multiImageEdit = ng.get('multiImageEdit');
    const notify = ng.get('notify');
    const packages = ng.get('packages');
    const remove = ng.get('remove');
    const send = ng.get('send');
    const privileges = ng.get('privileges');
    const confirm = ng.get('confirm');
    const session = ng.get('session');
    const spike = ng.get('spike');
    const superdesk = ng.get('superdesk');

    const personalLocationPath = $location.path() === '/workspace/personal';

    function sendFn() {
        send.all(getSelectedItems());
    }

    function sendAs() {
        send.allAs(getSelectedItems());
    }

    const fetch = (fetchAs = false) => {
        const items = getSelectedItems().concat();

        setActioning(true, items);

        (fetchAs ?
            send.allAs(getSelectedItems(), 'externalsourceTo') :
            send.all(getSelectedItems())
        )
            .then(() => {
                unselectAll();
            })
            .finally(() => {
                setActioning(false, items);
            });
    };

    const setActioning = (actioning: boolean, items) => {
        items.forEach((item) => {
            $rootScope.$broadcast('item:actioning', {item, actioning});
        });
    };

    function canRemoveIngestItems() {
        var canRemove = true;

        getSelectedItems().forEach((item) => {
            canRemove = canRemove && remove.canRemove(item);
        });
        return canRemove;
    }

    /**
     * Remove multiple ingest items
     */
    function removeIngestItems() {
        getSelectedItems().forEach((item) => {
            remove.remove(item);
        });
        unselectAll();
    }

    function multiedit() {
        multiEdit.create(getSelectedItems().map(({_id}) => _id));
        multiEdit.open();
    }

    function multiImageEditFn() {
        // before opening the edit modal make sure all the items are locked
        Promise.all(getSelectedItems().map((item) => lock.lock(item, true, 'edit')))
            .then((selectedImages) => {
                multiImageEdit.edit(selectedImages, (editedImages: Array<IArticle>) => Promise.all(
                    editedImages.map((image: IArticle) => authoring.save(
                        _.find(selectedImages, (_item: IArticle) => _item._id === image._id),
                        image,
                    )),
                ));
            });
    }

    function createPackage() {
        packages.createPackageFromItems(getSelectedItems())
            .then((newPackage) => {
                superdesk.intent('edit', 'item', newPackage);
                unselectAll();
            }, (response) => {
                if (response.status === 403 && response.data && response.data._message) {
                    notify.error(gettext(response.data._message), 3000);
                }
            });
    }

    function addToPackage() {
        $rootScope.$broadcast('package:addItems', {items: getSelectedItems(), group: 'main'});
        unselectAll();
    }

    /**
     * Multiple item spike
     */
    function spikeItems(): void {
        const spikeMultiple = () => {
            spike.spikeMultiple(getSelectedItems());
            $rootScope.$broadcast('item:spike');
            unselectAll();
        };

        if ($location.path() === '/workspace/personal') {
            modal.confirm(gettext('Do you want to delete the items permanently?')).then(spikeMultiple);
            return;
        }

        const onSpikeMultipleMiddlewares
            : Array<IExtensionActivationResult['contributions']['entities']['article']['onSpikeMultiple']>
            = flatMap(
                Object.values(extensions).map(({activationResult}) => activationResult),
                (activationResult) =>
                    activationResult.contributions != null
                    && activationResult.contributions.entities != null
                    && activationResult.contributions.entities.article != null
                    && activationResult.contributions.entities.article.onSpikeMultiple != null
                        ? activationResult.contributions.entities.article.onSpikeMultiple
                        : [],
            );

        const items: Array<IArticle> = getSelectedItems();

        showSpikeDialog(
            modal,
            () => spikeMultiple(),
            gettext('Are you sure you want to spike the items?'),
            onSpikeMultipleMiddlewares,
            items,
        );
    }

    /**
     * Multiple item unspike
     */
    function unspikeItems() {
        spike.unspikeMultiple(getSelectedItems());
        $rootScope.$broadcast('item:unspike');
        unselectAll();
    }

    const canEditMetadata = () => getSelectedItems().every(
        (item) => !item.lock_user && ['picture', 'video', 'audio'].includes(item.type),
    );

    function canPackageItems() {
        var canPackage = true;

        getSelectedItems().forEach((item) => {
            canPackage = canPackage && item._type !== 'archived' && !item.lock_user &&
                !_.includes(['ingested', 'spiked', 'killed', 'recalled', 'unpublished', 'draft'], item.state);
        });
        return canPackage;
    }

    function canPublishItem() {
        return getSelectedItems().every((item) => {
            const desk = desks.getCurrentDesk();

            if (privileges.userHasPrivileges({publish: 1})
                && !(desk.desk_type === 'authoring' && appConfig?.features?.noPublishOnAuthoringDesk)) {
                if (item.state !== 'draft' && $location.path() !== '/workspace/personal') {
                    return true;
                } else if (item.state !== 'draft' && $location.path() === '/workspace/personal') {
                    return appConfig?.features?.publishFromPersonal;
                }
            }

            return false;
        });
    }

    /**
     * Multiple items duplicate
     */
    function duplicateTo() {
        return send.allAs(getSelectedItems(), 'duplicateTo').then(() => {
            unselectAll();
        });
    }

    function duplicateInPlace() {
        const items = getSelectedItems();

        items.forEach((item) => {
            api.save('duplicate', {}, {
                desk: desks.getCurrentDeskId(),
                type: item._type,
                item_id: item._id,
            }, item).then(() => {
                $rootScope.$broadcast('item:duplicate');
                notify.success(gettext('Item Duplicated'));
            }, (response) => {
                var message = gettext('Failed to duplicate the item');

                if (angular.isDefined(response.data._message)) {
                    message = message + ': ' + response.data._message;
                }

                notify.error(message);
                item.error = response;
            });
        });

        unselectAll();
    }

    /**
     * @description Checks if all items multi-selected are eligible to be highlighted
     * @returns {Boolean}
     */
    function canHighlightItems() {
        return getSelectedItems().every((item) => authoring.itemActions(item).mark_item_for_highlight);
    }

    /**
     * Publish all items
     */
    const publish = () => {
        const errors = [];

        const addErrorForItem = (item, err) => {
            const itemName = item.headline || item.slugline || item._id;

            if (
                typeof err === 'object'
                && typeof err.data === 'object'
                && typeof err.data._issues === 'object'
                && err.data._issues['validator exception'] != null
            ) {
                errors.push({
                    itemName,
                    message: err.data._issues['validator exception'],
                });
            } else {
                errors.push({
                    itemName,
                    message: gettext('Unknown error occured. Try publishing the item from the article edit view.'),
                });
            }
        };

        const selectedItems = getSelectedItems();

        confirmPublish(selectedItems).then(() => {
            Promise.all<void>(
                selectedItems.map((item) => new Promise((resolve) => {
                    authoring.publish(item, item)
                        .then((response) => {
                            if (response.status >= 400) {
                                addErrorForItem(item, response);
                            }

                            resolve();
                        })
                        .catch((response) => {
                            addErrorForItem(item, response);
                            resolve();
                        });
                })),
            ).then(() => {
                if (errors.length < 1) {
                    notify.success(gettext('All items were published successfully.'));
                    unselectAll();
                } else {
                    errors.forEach((err) => {
                        let messages = null;

                        try {
                            messages = JSON.parse(err.message.replace(/'/gi, '"'));
                        } catch (error) {
                            messages = [[err.message]];
                        }
                        messages[0].forEach((message: string) =>
                            notify.error(gettext('Error on item:') + ` ${err.itemName} ${message}`));
                    });
                }
            });
        });
    };

    const deschedule = () => {
        const descheduled = () => {
            const errors = [];
            const success = [];

            Promise.all(
                items.map((item) => api.update('archive', item, {publish_schedule: null})
                    .then((response) => {
                        if (response) {
                            success.push(item);
                        } else {
                            errors.push({
                                'itemName': item.headline || item.slugline || item._id,
                                'message': response.data._message,
                            });
                        }
                    }).catch((err) => {
                        errors.push({
                            'itemName': item.headline || item.slugline || item._id,
                            'message': gettext('Unknown error occured, Try descheduling again.'),
                        });
                    }),
                )).then(() => {
                if (errors.length === 0) {
                    notify.success(gettext('{{count}} articles have been descheduled', {count: success.length}));
                } else {
                    errors.forEach((err) => {
                        let messages = null;

                        try {
                            messages = JSON.parse(err.message.replace(/'/gi, '"'));
                        } catch (error) {
                            messages = [[err.message]];
                        }
                        messages[0].forEach((message: string) =>
                            notify.error(gettext('Error on item:') + ` ${err.itemName} ${message}`));
                    });
                }
                unselectAll();
            });
        };

        const items: Array<IArticle> = getSelectedItems()
            .filter((item) => item?.schedule_settings?.utc_publish_schedule);

        modal.confirm(gettext('Do you want to deschedule articles?')).then(descheduled);
    };

    const actions: IMultiActions = {
        send: sendFn,
        sendAs,
        fetch,
        canRemoveIngestItems,
        removeIngestItems,
        multiedit,
        multiImageEdit: multiImageEditFn,
        createPackage,
        addToPackage,
        spikeItems,
        unspikeItems,
        canEditMetadata,
        canPackageItems,
        canPublishItem,
        duplicateTo,
        duplicateInPlace,
        canHighlightItems,
        publish,
        deschedule,
    };

    return actions;
}
