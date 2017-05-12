import * as helpers from 'apps/authoring/authoring/helpers';

const HTMLWorker = require('worker!./HTMLWorker');
const RESOURCE = 'archive_autosave',
    AUTOSAVE_TIMEOUT = 3000;

let $q, $timeout, api;

export class AutosaveService {

    constructor(_$q, _$timeout, _api) {
        $q = _$q;
        $timeout = _$timeout;
        api = _api;

        this.timeouts = {};
        this.workers = {};
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

            return this.prepareItem(diff).then((newItem) =>
                api.save(RESOURCE, {}, newItem).then((_autosave) => {
                    orig._autosave = _autosave;
                    return _autosave;
                }));
        }, timeout, false);

        return this.timeouts[id];
    }

    prepareItem(item) {
        const editorState = item.editor_state;
        const id = item._id;

        if (!editorState || !Array.isArray(editorState.blocks)) {
            return $q.resolve(item);
        }

        this.workers[id] = new HTMLWorker();

        return $q((resolve, reject) => {
            this.workers[id].onmessage = ({data}) => {
                item.body_html = data.html;
                resolve(item);
            };

            this.workers[id].postMessage({rawContent: editorState});
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

            if (this.workers[id]) {
                this.workers[id].terminate();
                this.workers[id] = null;
            }
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
