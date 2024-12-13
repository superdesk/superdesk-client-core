import {toElasticQuery, toPyEveQuery} from 'core/query-formatting';
import {IHttpRequestOptionsLocal, ISuperdeskQuery} from 'superdesk-api';

const elasticEndpoints = [
    '/archive',
    '/search',
    '/rundowns',
    '/rundown_items',
    '/events',
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
            urlParams: toElasticQuery(query),
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
