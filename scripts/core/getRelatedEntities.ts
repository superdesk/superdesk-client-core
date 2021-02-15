import {IArticle, IListViewFieldWithOptions, IRestApiResponse} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {DEFAULT_LIST_CONFIG} from 'apps/search/constants';
import {flatMap, get} from 'lodash';
import {fields} from 'apps/search/components/fields';
import {httpRequestJsonLocal} from './helpers/network';
import {Set, Map} from 'immutable';

/**
 * Holds Maps of entities keyed by IDs.
 */
export type IRelatedEntities = {[collectionName: string]: Map<string, any>};

export function getRelatedEntities(items: Array<IArticle>): Promise<IRelatedEntities> {
    return new Promise((resolve) => {
        const listConfig = appConfig.list ?? DEFAULT_LIST_CONFIG;

        const configuredFields: Array<string | IListViewFieldWithOptions> = []
            .concat(listConfig.priority ?? [])
            .concat(listConfig.firstLine ?? [])
            .concat(listConfig.secondLine ?? []);

        const relatedEntities = flatMap(configuredFields, (f) => {
            const field = typeof f === 'string' ? f : f.field;

            const component = fields[field];

            return component?.relatedEntities ?? [];
        });

        Promise.all(
            relatedEntities.map(({pathToId, collection}) => {
                // Use a set to avoid duplicates(multiple items may have the same related entity ID).
                let ids = Set<string>();

                items.forEach((item) => {
                    const id = get(item, pathToId);

                    if (id != null) {
                        ids = ids.add(id);
                    }
                });

                return httpRequestJsonLocal<IRestApiResponse<unknown>>({
                    method: 'GET',
                    path: `/${collection}?where=${JSON.stringify({_id: {$in: ids.toJS()}})}`,
                });
            }),
        ).then((responses) => {
            const entities: {[key: string]: Map<string, any>} = {};

            relatedEntities.forEach(({collection}, index) => {
                const entityItems = responses[index]?._items;

                if (entityItems?.length < 1) {
                    return;
                }

                entities[collection] = Map<string, any>();

                entityItems.forEach((entity) => {
                    entities[collection] = entities[collection].set(entity._id, entity);
                });
            });

            resolve(entities);
        });
    });
}
