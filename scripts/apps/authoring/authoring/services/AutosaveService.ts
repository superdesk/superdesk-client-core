import * as helpers from 'apps/authoring/authoring/helpers';
import {AUTOSAVE_TIMEOUT} from 'core/constants';
import {IArticle} from 'superdesk-api';
import {runBeforeUpdateMiddlware, runAfterUpdateEvent} from './authoring-helpers';

const RESOURCE = 'archive_autosave';

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

    hasUnsavedChanges(item): Promise<boolean> {
        if (this.timeouts[item._id] != null) {
            return Promise.resolve(true);
        } else {
            return new Promise((resolve) => {
                api.find(RESOURCE, item._id)
                    .then(() => resolve(true))
                    .catch(() => resolve(false)); // 404
            });
        }
    }

    /** If auto-save is in progress, wait for it to finish */
    settle(item): Promise<void> {
        return this.timeouts[item._id] ?? $q.resolve();
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
    save(item: IArticle, orig: IArticle, timeout: number = AUTOSAVE_TIMEOUT, callback) {
        if (!item._editable || !item._locked) {
            return $q.reject('item not ' + item._editable ? 'locked' : 'editable');
        }

        this.stop(item);

        let id = item._id;

        this.timeouts[id] = $timeout(() => {
            runBeforeUpdateMiddlware(item, orig)
                .then((itemLatest: IArticle) => {
                    var diff = helpers.extendItem({_id: id}, itemLatest);

                    helpers.filterDefaultValues(diff, orig);

                    return api.save(RESOURCE, {}, diff).then((_autosave: IArticle) => {
                        runAfterUpdateEvent(orig, _autosave);

                        orig._autosave = _autosave;

                        if (typeof callback === 'function') {
                            callback();
                        }

                        return _autosave;
                    });
                });
        }, timeout, false);

        return this.timeouts[id].catch((e) => {
            if (e !== 'canceled') {
                throw e;
            }
        });
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
