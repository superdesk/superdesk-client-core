import {ISuperdesk, IRestApiResponse} from 'superdesk-api';
import {IStorageDestinationItem} from '../interfaces';

import {sortBy} from 'lodash';

const RESOURCE = 'sams/destinations';

export function getAllStorageDestinations(superdesk: ISuperdesk): Promise<Array<IStorageDestinationItem>> {
    return superdesk.dataApi.query(
        RESOURCE,
        1,
        {field: 'name', direction: 'ascending'},
        {},
    )
        .then((response: IRestApiResponse<IStorageDestinationItem>) => {
            return sortBy<IStorageDestinationItem>(
                response?._items ?? [],
                ['_id'],
            );
        });
}
