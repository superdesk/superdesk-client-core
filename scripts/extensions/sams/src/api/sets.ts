// Types
import {IRestApiResponse} from 'superdesk-api';
import {ISetItem} from '../interfaces';
import {superdeskApi} from '../apis';

// Utils
import {fixItemResponseVersionDates} from './common';
import {getApiErrorMessage, isSamsApiError} from '../utils/api';

const RESOURCE = 'sams/sets';

export function getAllSets(): Promise<Array<ISetItem>> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.query<ISetItem>(
        RESOURCE,
        1,
        {field: 'name', direction: 'ascending'},
        {},
    )
        .then(fixItemResponseVersionDates)
        .then((response: IRestApiResponse<ISetItem>) => {
            return response?._items ?? [];
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to load all sets'));
            }

            return Promise.reject(error);
        });
}

export function createSet(item: Partial<ISetItem>): Promise<ISetItem> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.create<ISetItem>(RESOURCE, item)
        .then((set: ISetItem) => {
            notify.success(gettext('Set created successfully'));

            return set;
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to create the Set'));
            }

            return Promise.reject(error);
        });
}

export function updateSet(original: ISetItem, updates: Partial<ISetItem>): Promise<ISetItem> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.patch<ISetItem>(RESOURCE, original, updates)
        .then((set: ISetItem) => {
            notify.success(gettext('Set updated successfully'));

            return set;
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to update the Set'));
            }

            return Promise.reject(error);
        });
}

export function deleteSet(item: ISetItem): Promise<void> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.delete<ISetItem>(RESOURCE, item)
        .then(() => {
            notify.success(gettext('Set deleted successfully'));
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to delete the Set'));
            }

            return Promise.reject(error);
        });
}
