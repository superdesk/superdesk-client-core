import {IArticle, IListViewFieldWithOptions, IRestApiResponse, IResourceChange, ISuperdeskQuery} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {DEFAULT_LIST_CONFIG} from 'apps/search/constants';
import {flatMap} from 'lodash';
import {fields} from 'apps/search/components/fields';
import {httpRequestJsonLocal} from './helpers/network';
import {Set, Map} from 'immutable';
import {notNullOrUndefined} from './helpers/typescript-helpers';
import {ignoreAbortError} from './SuperdeskReactComponent';
import {prepareSuperdeskQuery} from './helpers/universal-query';

/**
 * Holds Maps of entities keyed by IDs.
 */
export type IRelatedEntities = {[collectionName: string]: Map<string, any>};
export type IEntitiesToFetch = {[collectionName: string]: Set<string>};

function mergeRelatedEntities(a: IRelatedEntities, b: IRelatedEntities): IRelatedEntities {
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

export function getAndMergeRelatedEntitiesForArticles(
    items: Array<IArticle>,
    alreadyFetched: IRelatedEntities,
    abortSignal: AbortSignal,
): Promise<IRelatedEntities> {
    const listConfig = appConfig.list ?? DEFAULT_LIST_CONFIG;

    const configuredFields: Array<string | IListViewFieldWithOptions> = []
        .concat(listConfig.priority ?? [])
        .concat(listConfig.firstLine ?? [])
        .concat(listConfig.secondLine ?? []);

    const relatedEntitiesConfigGetterFunctions = flatMap(configuredFields, (f) => {
        const field = typeof f === 'string' ? f : f.field;

        const component = fields[field];

        return component?.getRelatedEntities;
    }).filter(notNullOrUndefined);

    // ids indexed by collection name
    const entitiesToFetch: IEntitiesToFetch = {};

    items.forEach((item) => {
        relatedEntitiesConfigGetterFunctions.forEach((fn) => {
            fn(item).forEach(({collection, id}) => {
                if (id != null && !alreadyFetched[collection]?.has(id)) {
                    if (entitiesToFetch[collection] == null) {
                        entitiesToFetch[collection] = Set<string>();
                    }

                    entitiesToFetch[collection] = entitiesToFetch[collection].add(id);
                }
            });
        });
    });

    return fetchRelatedEntities(entitiesToFetch, abortSignal)
        .then((result) => mergeRelatedEntities(alreadyFetched, result));
}

export function getAndMergeRelatedEntitiesUpdated(
    currentEntities: IRelatedEntities,
    changes: Array<IResourceChange>,
    abortSignal: AbortSignal,
): Promise<IRelatedEntities> {
    const changesToRelatedEntities = changes.filter(
        ({changeType, resource, itemId}) =>
            changeType !== 'deleted' && currentEntities[resource]?.get(itemId) != null,
    );

    const entitiesToFetch = changesToRelatedEntities.reduce<IEntitiesToFetch>((acc, change) => {
        if (acc[change.resource] == null) {
            acc[change.resource] = Set<string>();
        }

        acc[change.resource] = acc[change.resource].add(change.itemId);

        return acc;
    }, {});

    if (Object.keys(entitiesToFetch).length > 0) {
        return fetchRelatedEntities(entitiesToFetch, abortSignal)
            .then((result) => mergeRelatedEntities(currentEntities, result));
    } else {
        return Promise.resolve(currentEntities);
    }
}

export function fetchRelatedEntities(
    entitiesToFetch: IEntitiesToFetch,
    abortSignal: AbortSignal,
): Promise<IRelatedEntities> {
    return new Promise((resolve) => {
        const result: IRelatedEntities = {};

        Promise.all(
            Object.keys(entitiesToFetch).map((collection) => {
                const ids: Array<string> = entitiesToFetch[collection].toJS();

                const byIdQuery: ISuperdeskQuery = {
                    filter: {
                        $and: [
                            {
                                _id: {$in: ids},
                            },
                        ],
                    },
                    page: 1,
                    max_results: 200,
                    sort: [{'_created': 'desc'}], // doesn't matter
                };

                return ignoreAbortError(
                    httpRequestJsonLocal<IRestApiResponse<unknown>>({
                        ...prepareSuperdeskQuery(`/${collection}`, byIdQuery),
                        abortSignal,
                    }),
                ).then((response) => {
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
