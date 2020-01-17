import {IBaseRestApiResponse, ISortOption, IRestApiResponse} from 'superdesk-api';
import ng from 'core/services/ng';
import {appConfig} from 'appConfig';
import {get} from 'lodash';

function fetchPage<T extends IBaseRestApiResponse>(items: Array<T>, url: string, authenticationToken: string) {
    return fetch(appConfig.server.url + '/' + url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authenticationToken,
        },
        mode: 'cors',
    })
        .then((res) => res.json())
        .then((resJson: IRestApiResponse<T>) => {
            const currentItems = items.concat(resJson._items);

            if (get(resJson, '_links.next.href') == null) {
                return Promise.resolve(currentItems);
            } else {
                return fetchPage(currentItems, resJson._links.next.href, authenticationToken);
            }
        });
}

export function fetchAll<T extends IBaseRestApiResponse>(endpoint: string, sort: ISortOption) {
    const sortOption = (sort.direction === 'descending' ? '-' : '') + sort.field;

    return ng.getService('session')
        .then((session) => {
            return fetchPage<T>([], endpoint + `?sort=${sortOption}&max_results=200`, session.token);
        });
}
