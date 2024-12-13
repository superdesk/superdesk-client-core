import * as helpers from 'apps/authoring/authoring/helpers';
import {AUTOSAVE_TIMEOUT} from 'core/constants';
import {IArticle} from 'superdesk-api';
import {authoringApiCommon} from 'apps/authoring-bridge/authoring-api-common';

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
    save(
        item: IArticle,
        orig: IArticle,
        timeout: number = AUTOSAVE_TIMEOUT,
        callback, applyAsync?: () => Promise<void>,
    ) {
        if (!item._editable || !item._locked) {
            return $q.reject('item not ' + item._editable ? 'locked' : 'editable');
        }

        this.stop(item);

        const id = item._id;

        this.timeouts[id] = $timeout(() => {
            authoringApiCommon.saveBefore(item, orig)
                .then((itemLatest: IArticle) => {
                    const diff = helpers.extendItem({_id: id}, itemLatest);

                    helpers.filterDefaultValues(diff, orig);
                    helpers.extendItem(item, diff); // update item for changes to get picked up by the editor

                    const saveAndRunMiddleware = () => {
                        return api.save(RESOURCE, {}, diff).then((_autosave: IArticle) => {
                            authoringApiCommon.saveAfter(item, orig);
                            orig._autosave = _autosave;
                            callback?.();

                            return _autosave;
                        });
                    };

                    if (applyAsync) {
                        // update authoring view
                        return applyAsync().then(() => saveAndRunMiddleware());
                    }

                    return saveAndRunMiddleware();
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
