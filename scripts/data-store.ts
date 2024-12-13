import {OrderedMap} from 'immutable';
import {once} from 'lodash';
import {IContentProfile, ISuperdeskQuery} from 'superdesk-api';
import {DataProvider} from 'core/helpers/data-provider';
import {prepareSuperdeskQuery} from 'core/helpers/universal-query';

/**
 * Stores entities accessible globally and keeps it up date via websocket messages
 */
class DataStore {
    public contentProfiles: OrderedMap<IContentProfile['_id'], IContentProfile>;

    constructor() {
        this.contentProfiles = OrderedMap();
    }

    private loadContentProfiles(): Promise<void> {
        return new Promise((resolve) => {
            const resolveOnce = once(resolve);

            const query: ISuperdeskQuery = {
                filter: {},
                page: 1,
                max_results: 200,
                sort: [{'versioncreated': 'asc'}], // sorting isn't relevant
            };

            new DataProvider<IContentProfile>(
                () => {
                    const {path, urlParams} = prepareSuperdeskQuery('content_types', query);

                    return {
                        method: 'GET',
                        endpoint: path,
                        params: urlParams,
                    };
                },
                (response) => {
                    this.contentProfiles = OrderedMap();

                    for (const item of response._items) {
                        this.contentProfiles = this.contentProfiles.set(item._id, item);
                    }

                    resolveOnce();
                },
                {'content_types': true},
            );
        });
    }

    initialize() {
        return this.loadContentProfiles();
    }
}

export const dataStore = new DataStore();
