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

export function mergeRelatedEntities(a: IRelatedEntities, b: IRelatedEntities): IRelatedEntities {
    const next: IRelatedEntities = {...a};

    Object.keys(b).forEach((entityName) => {
        if (next[entityName] == null) {
            next[entityName] = b[entityName];
        } else {
            next[entityName] = next[entityName].merge(b[entityName]);
        }
    });

    return next;
}

export function getRelatedEntities(
    items: Array<IArticle>,
    alreadyFetched: IRelatedEntities,
): Promise<IRelatedEntities> {
    return new Promise((resolve) => {
        const listConfig = appConfig.list ?? DEFAULT_LIST_CONFIG;

        const configuredFields: Array<string | IListViewFieldWithOptions> = []
            .concat(listConfig.priority ?? [])
            .concat(listConfig.firstLine ?? [])
            .concat(listConfig.secondLine ?? []);

        const relatedEntitiesConfig = flatMap(configuredFields, (f) => {
            const field = typeof f === 'string' ? f : f.field;

            const component = fields[field];

            return component?.relatedEntities ?? [];
        });

        // ids indexed by collection name
        const itemsToFetch: {[collectionName: string]: Set<string>} = {};

        items.forEach((item) => {
            relatedEntitiesConfig.forEach(({pathToId, collection}) => {
                const id = get(item, pathToId);

                if (id != null && !alreadyFetched[collection]?.has(id)) {
                    if (itemsToFetch[collection] == null) {
                        itemsToFetch[collection] = Set<string>();
                    }

                    itemsToFetch[collection] = itemsToFetch[collection].add(id);
                }
            });
        });

        const result: IRelatedEntities = {};

        Promise.all(
            Object.keys(itemsToFetch).map((collection) => {
                const ids: Array<string> = itemsToFetch[collection].toJS();

                return httpRequestJsonLocal<IRestApiResponse<unknown>>({
                    method: 'GET',
                    path: `/${collection}?where=${JSON.stringify({_id: {$in: ids}})}`,
                }).then((response) => {
                    result[collection] = Map<string, any>();

                    response._items.forEach((entity) => {
                        result[collection] = result[collection].set(entity._id, entity);
                    });
                });
            }),
        ).then(() => {
            resolve(result);
        });
    });
}
