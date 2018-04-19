import _ from 'lodash';

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
 * @description MultiActionBarController holds a set of convenience functions which
 * are used by the Multi-Action bar wwhen an item is click-selected.
 */

MultiActionBarController.$inject = [
    '$rootScope', 'multi', 'multiEdit', 'send', 'remove', 'modal', '$q', 'gettext',
    'packages', 'superdesk', 'notify', 'spike', 'authoring', 'privileges', '$location',
];

export function MultiActionBarController(
    $rootScope, multi, multiEdit, send, remove, modal, $q, gettext,
    packages, superdesk, notify, spike, authoring, privileges, $location
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

    this.createPackage = function() {
        packages.createPackageFromItems(multi.getItems())
            .then((newPackage) => {
                superdesk.intent('edit', 'item', newPackage);
            }, (response) => {
                if (response.status === 403 && response.data && response.data._message) {
                    notify.error(gettext(response.data._message), 3000);
                }
            });
    };

    this.addToPackage = function() {
        $rootScope.$broadcast('package:addItems', {items: multi.getItems(), group: 'main'});
    };

    /**
     * Multiple item spike
     */
    this.spikeItems = function() {
        let message = gettext('Are you sure you want to spike the items?');

        if ($location.path() === '/workspace/personal') {
            message = gettext('Do you want to delete the items permanently?');
        }

        if (_.get(privileges, 'privileges.planning')) {
            var assignedItems = multi.getItems().filter((item) => item.assignment_id);

            if (assignedItems.length) {
                message = gettext('Some item/s are linked to in-progress planning coverage, spike anyway?');
            }
        }

        return modal.confirm(message)
            .then(() => {
                spike.spikeMultiple(multi.getItems());
                $rootScope.$broadcast('item:spike');
                multi.reset();
            });
    };

    /**
     * Multiple item unspike
     */
    this.unspikeItems = function() {
        spike.unspikeMultiple(multi.getItems());
        $rootScope.$broadcast('item:unspike');
        multi.reset();
    };

    this.canPackageItems = function() {
        var canPackage = true;

        multi.getItems().forEach((item) => {
            canPackage = canPackage && item._type !== 'archived' && !item.lock_user &&
                !_.includes(['ingested', 'spiked', 'killed', 'draft'], item.state);
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
