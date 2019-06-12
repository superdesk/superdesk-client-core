import _ from 'lodash';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';

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
                // <TECHNICAL DEBT>
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
                // </TECHNICAL DEBT>

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
    this.spikeItems = function() {
        let message = gettext('Are you sure you want to spike the items?');
        const assignedItems = _.get(privileges, 'privileges.planning') ?
            multi.getItems().filter((item) => item.assignment_id) : [];
        const spikeMultiple = () => {
            spike.spikeMultiple(multi.getItems());
            $rootScope.$broadcast('item:spike');
            multi.reset();
        };

        if ($location.path() === '/workspace/personal') {
            message = gettext('Do you want to delete the items permanently?');
        } else if (assignedItems.length) {
            message = gettext('Some item/s are linked to in-progress planning coverage, spike anyway?');
        } else if (!_.get(config, 'confirm_spike', true)) {
            spikeMultiple();
            return;
        }

        return modal.confirm(message)
            .then(spikeMultiple);
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
        $q.all(multi.getItems().map((item) => authoring.publish(item, item)))
            .then((responses) => {
                const withErrors = responses.some((response) => response.status >= 400);

                if (withErrors) {
                    notify.error(gettext('Some items could not be published.'));
                } else {
                    notify.success(gettext('All items were published successfully.'));
                    multi.reset();
                }
            });
    };
}
