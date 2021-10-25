// External Modules
import {sortBy} from 'lodash';

// Types
import {IRestApiResponse} from 'superdesk-api';
import {IStorageDestinationItem} from '../interfaces';
import {superdeskApi} from '../apis';

// Utils
import {getApiErrorMessage, isSamsApiError} from '../utils/api';

const RESOURCE = 'sams/destinations';

export function getAllStorageDestinations(): Promise<Array<IStorageDestinationItem>> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.query(
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
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to load all storage destinations'));
            }

            return Promise.reject(error);
        });
}
