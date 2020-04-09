/* eslint-disable indent */

import React from 'react';
import _, {flatMap} from 'lodash';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';

import {IExtensionActivationResult} from 'superdesk-api';
import {extensions} from 'appConfig';
import {showSpikeDialog} from 'apps/archive/show-spike-dialog';

/**
 * @ngdoc controller
 * @module superdesk.apps.search
 * @name MultiActionBarController
 * @requires $rootScope
 * @requires multi
 * @requires multiEdit
 * @requires send
 * @requires remove
 * @requires modal
 * @requires $q
 * @requires packages
 * @requires superdesk
 * @requires notify
 * @requires spike
 * @requires authoring
 * @requires $location
 * @requires config
 * @description MultiActionBarController holds a set of convenience functions which
 * are used by the Multi-Action bar wwhen an item is click-selected.
 */

MultiActionBarController.$inject = [
    '$rootScope', 'multi', 'multiEdit', 'multiImageEdit', 'send', 'remove', 'modal', 'lock',
    'packages', 'superdesk', 'notify', 'spike', 'authoring', '$location', 'api', 'desks',
];

export function MultiActionBarController(
    $rootScope, multi, multiEdit, multiImageEdit, send, remove, modal, lock,
    packages, superdesk, notify, spike, authoring, $location, api, desks,
) {
    this.send = function() {
        send.all(multi.getItems());
    };

    this.sendAs = function() {
        send.allAs(multi.getItems());
    };

    this.fetch = (fetchAs = false) => {
        const items = multi.getItems().concat();

        setActioning(true, items);

        (fetchAs ?
            send.allAs(multi.getItems(), 'externalsourceTo') :
            send.all(multi.getItems())
        )
        .then(() => {
            multi.reset();
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

    this.canRemoveIngestItems = function() {
        var canRemove = true;

        multi.getItems().forEach((item) => {
            canRemove = canRemove && remove.canRemove(item);
        });
        return canRemove;
    };

    /**
     * Remove multiple ingest items
     */
    this.removeIngestItems = function() {
        multi.getItems().forEach((item) => {
            remove.remove(item);
        });
        multi.reset();
    };

    this.multiedit = function() {
        multiEdit.create(multi.getIds());
        multiEdit.open();
    };

    this.multiImageEdit = function() {
        // before opening the edit modal make sure all the items are locked
        Promise.all(multi.getItems().map((item) => lock.lock(item, true, 'edit')))
            .then((selectedImages) => {
                multiImageEdit.edit(selectedImages, (editedImages: Array<IArticle>) => Promise.all(
                        editedImages.map((image: IArticle) => authoring.save(
                        _.find(selectedImages, (_item: IArticle) => _item._id === image._id),
                        image,
                    )),
                ));
            });
    };

    this.createPackage = function() {
        packages.createPackageFromItems(multi.getItems())
            .then((newPackage) => {
                superdesk.intent('edit', 'item', newPackage);
                multi.reset();
            }, (response) => {
                if (response.status === 403 && response.data && response.data._message) {
                    notify.error(gettext(response.data._message), 3000);
                }
            });
    };

    this.addToPackage = function() {
        $rootScope.$broadcast('package:addItems', {items: multi.getItems(), group: 'main'});
        multi.reset();
    };

    /**
     * Multiple item spike
     */
    this.spikeItems = function(): void {
        const spikeMultiple = () => {
            spike.spikeMultiple(multi.getItems());
            $rootScope.$broadcast('item:spike');
            multi.reset();
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

        const items: Array<IArticle> = multi.getItems();

        showSpikeDialog(
            modal,
            () => spikeMultiple(),
            gettext('Are you sure you want to spike the items?'),
            onSpikeMultipleMiddlewares,
            items,
        );
    };

    /**
     * Multiple item unspike
     */
    this.unspikeItems = function() {
        spike.unspikeMultiple(multi.getItems());
        $rootScope.$broadcast('item:unspike');
        multi.reset();
    };

    this.canEditMetadata = () => multi.getItems().every(
        (item) => !item.lock_user && ['picture', 'video', 'audio'].includes(item.type),
    );

    this.canPackageItems = function() {
        var canPackage = true;

        multi.getItems().forEach((item) => {
            canPackage = canPackage && item._type !== 'archived' && !item.lock_user &&
                !_.includes(['ingested', 'spiked', 'killed', 'recalled', 'unpublished', 'draft'], item.state);
        });
        return canPackage;
    };

    /**
     * Multiple items duplicate
     */
    this.duplicateTo = function() {
        return send.allAs(multi.getItems(), 'duplicateTo');
    };

    this.duplicateInPlace = function() {
        const items = multi.getItems();

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

        multi.reset();
    };

    /**
     * @ngdoc method
     * @name MultiActionBarController#canHighlightItems
     * @description Checks if all items multi-selected are eligible to be highlighted
     * @returns {Boolean}
     */
    this.canHighlightItems = function() {
        return multi.getItems().every((item) => authoring.itemActions(item).mark_item_for_highlight);
    };

    /**
     * Publish all items
     */
    this.publish = () => {
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

        Promise.all(
            multi.getItems().map((item) => new Promise((resolve) => {
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
                multi.reset();
            } else {
                errors.forEach((err) => {
                    let messages = JSON.parse(err.message.replace(/'/gi, '"'));

                    messages[0].forEach((message: string) =>
                        notify.error(gettext('Error on item:') + ` ${err.itemName} ${message}`));
                });
            }
        });
    };
}
