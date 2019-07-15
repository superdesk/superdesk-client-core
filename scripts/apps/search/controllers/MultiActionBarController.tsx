/* eslint-disable indent */

import React from 'react';
import _, {flatMap} from 'lodash';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';

import {IExtensionActivationResult} from 'superdesk-api';
import {extensions} from 'core/extension-imports.generated';
import {showSpikeDialog} from 'apps/archive/show-spike-dialog';

import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader'
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';

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
    '$rootScope', 'multi', 'multiEdit', 'multiImageEdit', 'send', 'remove', 'modal', '$q',
    'packages', 'superdesk', 'notify', 'spike', 'authoring', 'privileges', '$location', 'config', 'api',
];

export function MultiActionBarController(
    $rootScope, multi, multiEdit, multiImageEdit, send, remove, modal, $q,
    packages, superdesk, notify, spike, authoring, privileges, $location, config, api,
) {
    this.send = function() {
        send.all(multi.getItems());
    };

    this.sendAs = function() {
        send.allAs(multi.getItems());
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
        const originalImages = multi.getItems();
        // load images fully. Using multi.getItems() doesn't work
        // since it doesn't contain "subject" required for "usage terms"

        Promise.all(multi.getIds().map((id) => api.find('archive', id)))
            .then((imagesFromDatabase) => {
                // SDESK-4343
                // UI state(`selected` property of the article) is stored on a database/API entity
                // because of that, it's not possible to use the latest data from the API
                // and it has to be patched on top of old data in order for UI state related properties to be preserved
                imagesFromDatabase.forEach((imageFromDb: IArticle) => {
                    const originalImage = originalImages.find((i) => i._id === imageFromDb._id);

                    // attaching missing properties to originalImages
                    for (const prop in imageFromDb) {
                        originalImage[prop] = imageFromDb[prop];
                    }
                });

                multiImageEdit.edit(originalImages, (editedImages) => Promise.all(
                    originalImages.map((image: IArticle) => authoring.save(
                        image,
                        _.find(editedImages, (item) => item._id === image._id),
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
            config,
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
                !_.includes(['ingested', 'spiked', 'killed', 'recalled', 'draft'], item.state);
        });
        return canPackage;
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
        }

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
                modal.createCustomModal()
                    .then(({openModal, closeModal}) => {
                        openModal(
                            <Modal>
                                <ModalHeader>{gettext('There were errors publishing the following items')}</ModalHeader>
                                <ModalBody>
                                    <dl>
                                        {
                                            errors.map((err, i) => (
                                                <React.Fragment key={i}>
                                                    <dt>{err.itemName}</dt>
                                                    <dd>{err.message}</dd>
                                                </React.Fragment>
                                            ))
                                        }
                                    </dl>
                                </ModalBody>
                                <ModalFooter>
                                    <button
                                        className="btn btn--primary"
                                        onClick={() => {
                                            closeModal();
                                        }}
                                    >
                                        {gettext('Close')}
                                    </button>
                                </ModalFooter>
                            </Modal>,
                        );
                    })
            }
        });
    };
}
