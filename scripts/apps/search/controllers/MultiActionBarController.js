MultiActionBarController.$inject = [
    '$rootScope', 'multi', 'multiEdit', 'send', 'remove', 'modal', '$q',
    'packages', 'superdesk', 'notify', 'spike', 'authoring', 'privileges', '$location'
];

export function MultiActionBarController(
    $rootScope, multi, multiEdit, send, remove, modal, $q,
    packages, superdesk, notify, spike, authoring, privileges, $location
) {
    this.send  = function() {
        send.all(multi.getItems());
    };

    this.sendAs = function() {
        send.allAs(multi.getItems());
    };

    this.canRemoveIngestItems = function() {
        var canRemove = true;
        multi.getItems().forEach(function(item) {
            canRemove = canRemove && remove.canRemove(item);
        });
        return canRemove;
    };

    /**
     * Remove multiple ingest items
     */
    this.removeIngestItems = function() {
        multi.getItems().forEach(function(item) {
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
        .then(function(new_package) {
            superdesk.intent('edit', 'item', new_package);
        }, function(response) {
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
        var isPersonal = $location.path() === '/workspace/personal';

        return $q.when(isPersonal ? modal.confirm(txt) : 0)
            .then(function() {
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
        multi.getItems().forEach(function(item) {
            canPackage = canPackage && item._type !== 'archived' && !item.lock_user &&
                !_.includes(['ingested', 'spiked', 'killed', 'draft'], item.state);
        });
        return canPackage;
    };
}
