import * as helpers from 'apps/authoring/authoring/helpers';
import {convertFromRaw} from 'draft-js';
import {toHTML} from 'core/editor3';
import {fieldsMetaKeys, getFieldMetadata} from 'core/editor3/helpers/fieldsMeta';

const RESOURCE = 'archive_autosave',
    AUTOSAVE_TIMEOUT = 3000;

let $q, $timeout, api, logger;

export class AutosaveService {
    constructor(_$q, _$timeout, _api, _logger) {
        $q = _$q;
        $timeout = _$timeout;
        api = _api;
        logger = _logger;

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

        this.generateAnnotations(item);

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
     * Generate item annotations field
     *
     * @param {Object} item
     */
    generateAnnotations(item) {
        const state = getFieldMetadata(item, 'body_html', fieldsMetaKeys.draftjsState);

        if (state) {
            let highlightsBlock = state.blocks[0];

            if (highlightsBlock.data && highlightsBlock.data.MULTIPLE_HIGHLIGHTS &&
                highlightsBlock.data.MULTIPLE_HIGHLIGHTS.highlightsData) {
                let annotations = [];

                _.forEach(highlightsBlock.data.MULTIPLE_HIGHLIGHTS.highlightsData, (highlight, key) => {
                    if (key.startsWith('ANNOTATION-')) {
                        let annotation = {};

                        annotation.id = key.split('-')[1];
                        annotation.type = highlight.data.annotationType;
                        annotation.body = toHTML(convertFromRaw(JSON.parse(highlight.data.msg)), logger);
                        annotations.push(annotation);
                    }
                });
                item.annotations = annotations;
            }
        }
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

AutosaveService.$inject = ['$q', '$timeout', 'api', 'logger'];
