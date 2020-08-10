// External Modules
import {sortBy} from 'lodash';

// Types
import {ISuperdesk, IRestApiResponse} from 'superdesk-api';
import {IStorageDestinationItem} from '../interfaces';

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
