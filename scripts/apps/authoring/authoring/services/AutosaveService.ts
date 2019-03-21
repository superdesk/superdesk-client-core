import * as helpers from 'apps/authoring/authoring/helpers';

const RESOURCE = 'archive_autosave',
    AUTOSAVE_TIMEOUT = 3000;

let $q, $timeout, api;

export class AutosaveService {
    timeouts: any;

    constructor(_$q, _$timeout, _api) {
        $q = _$q;
        $timeout = _$timeout;
        api = _api;

        this.timeouts = {};
    }

    /**
     * Open an item.
     */
    open(item) {
        if (!item._locked || !item._editable) {
            // no way to get autosave
            return $q.when(item);
        }

        return this.get(item);
    }

    /**
     * Get the resource.
     */
    get(item) {
        return api.find(RESOURCE, item._id).then((autosave) => {
            item._autosave = autosave;
            return item;
        });
    }

    /**
     * Auto-saves an item
     */
    save(item, orig, timeout = AUTOSAVE_TIMEOUT) {
        if (!item._editable || !item._locked) {
            return $q.reject('item not ' + item._editable ? 'locked' : 'editable');
        }

        this.stop(item);

        let id = item._id;

        this.timeouts[id] = $timeout(() => {
            var diff = helpers.extendItem({_id: id}, item);

            helpers.filterDefaultValues(diff, orig);
            return api.save(RESOURCE, {}, diff).then((_autosave) => {
                orig._autosave = _autosave;
                return _autosave;
            });
        }, timeout, false);

        return this.timeouts[id];
    }

    /**
     * Stop pending autosave
     */
    stop(item) {
        let id = item._id;

        if (this.timeouts[id]) {
            $timeout.cancel(this.timeouts[id]);
            this.timeouts[id] = null;
        }
    }

    /**
     * Drop autosave
     */
    drop(item) {
        this.stop(item);

        if (angular.isDefined(item._autosave) && item._autosave !== null) {
            api(RESOURCE).remove(item._autosave);
        }

        item._autosave = null;
    }
}

AutosaveService.$inject = ['$q', '$timeout', 'api'];
