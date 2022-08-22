import {toElasticQuery, toPyEveQuery} from 'core/query-formatting';
import {IHttpRequestOptionsLocal, ISuperdeskQuery} from 'superdesk-api';

const elasticEndpoints = [
    '/archive',
    '/rundowns',
    '/rundown_items',
];

export function prepareSuperdeskQuery(
    endpoint: string,
    query: ISuperdeskQuery,
): IHttpRequestOptionsLocal & {method: 'GET'} {
    if (elasticEndpoints.includes(endpoint)) {
        // Use elastic search query format
        return {
            method: 'GET',
            path: endpoint,
            urlParams: {
                source: toElasticQuery(query),
            },
        };
    } else {
        // Use pyeve query format
        return {
            method: 'GET',
            path: endpoint,
            urlParams: {
                page: query.page,
                max_results: query.max_results,
                ...toPyEveQuery(query.filter, query.sort),
            },
        };
    }
}
