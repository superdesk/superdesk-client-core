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
 * @requires config
 * @description MultiActionBarController holds a set of convenience functions which
 * are used by the Multi-Action bar wwhen an item is click-selected.
 */

MultiActionBarController.$inject = [
    '$rootScope', 'multi', 'multiEdit', 'send', 'remove', 'modal', '$q',
    'packages', 'superdesk', 'notify', 'spike', 'authoring', '$location', 'config'
];

export function MultiActionBarController(
    $rootScope, multi, multiEdit, send, remove, modal, $q,
    packages, superdesk, notify, spike, authoring, $location, config
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
        var txt = gettext('Do you want to delete these items permanently?');
        var showConfirmation = $location.path() === '/workspace/personal';

        if (_.get(config, 'features.planning')) {
            var assignedItems = multi.getItems().filter((item) => item.assignment_id);

            if (assignedItems.length) {
                showConfirmation = true;
                txt = gettext('Some item/s are linked to in-progress planning coverage, spike anyway?');
            }
        }

        return $q.when(showConfirmation ? modal.confirm(txt) : 0)
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
}
