// External Modules
import {sortBy} from 'lodash';

// Types
import {ISuperdesk, IRestApiResponse} from 'superdesk-api';
import {IStorageDestinationItem} from '../interfaces';

const RESOURCE = 'sams/destinations';

export function getAllStorageDestinations(superdesk: ISuperdesk): Promise<Array<IStorageDestinationItem>> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

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
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to load all storage destinations'));
            console.log(error);

            return Promise.reject(error);
        });
}
