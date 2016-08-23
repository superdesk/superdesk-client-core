import * as helpers from 'superdesk-authoring/authoring/helpers';

AutosaveService.$inject = ['$q', '$timeout', 'api'];
export function AutosaveService($q, $timeout, api) {
    var RESOURCE = 'archive_autosave',
        AUTOSAVE_TIMEOUT = 3000,
        timeouts = {},
        self = this;

    /**
     * Open an item
     */
    this.open = function openAutosave(item) {
        if (!item._locked || !item._editable) {
            // no way to get autosave
            return $q.when(item);
        }

        return self.get(item)
            .then(function(result) {
                return result;
            }, function(err) {
                return item;
            });
    };

    /**
     * Get the resource
     */
    this.get = function(item) {
        return api.find(RESOURCE, item._id).then(function(autosave) {
            item._autosave = autosave;
            return item;
        });
    };

    /**
     * Auto-saves an item
     */
    this.save = function saveAutosave(item, orig) {
        if (item._editable && item._locked) {
            this.stop(item);
            timeouts[item._id] = $timeout(function() {
                var diff = helpers.extendItem({_id: item._id}, item);
                helpers.filterDefaultValues(diff, orig);
                return api.save(RESOURCE, {}, diff).then(function(_autosave) {
                    orig._autosave = _autosave;
                });
            }, AUTOSAVE_TIMEOUT, false);

            return timeouts[item._id];
        }
    };

    /**
     * Stop pending autosave
     */
    this.stop = function stopAutosave(item) {
        if (timeouts[item._id]) {
            $timeout.cancel(timeouts[item._id]);
            timeouts[item._id] = null;
        }
    };

    /**
     * Drop autosave
     */
    this.drop = function dropAutosave(item) {
        this.stop(item);

        if (angular.isDefined(item._autosave) && item._autosave !== null) {
            api(RESOURCE).remove(item._autosave);
        }

        item._autosave = null;
    };
}
