// Types
import {ISuperdesk, IRestApiResponse} from 'superdesk-api';
import {ISetItem} from '../interfaces';

const RESOURCE = 'sams/sets';

export function getAllSets(superdesk: ISuperdesk): Promise<Array<ISetItem>> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.query<ISetItem>(
        RESOURCE,
        1,
        {field: 'name', direction: 'ascending'},
        {},
    )
        .then((response: IRestApiResponse<ISetItem>) => {
            return response?._items ?? [];
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to load all sets'));
            console.error(error);

            return Promise.reject(error);
        });
}

export function createSet(superdesk: ISuperdesk, item: Partial<ISetItem>): Promise<ISetItem> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.create<ISetItem>(RESOURCE, item as ISetItem)
        .then((set: ISetItem) => {
            notify.success(gettext('Set created successfully'));

            return set;
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to create the Set'));
            console.error(error);

            return Promise.reject(error);
        });
}

export function updateSet(superdesk: ISuperdesk, original: ISetItem, updates: Partial<ISetItem>): Promise<ISetItem> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.patch<ISetItem>(RESOURCE, original, updates as ISetItem)
        .then((set: ISetItem) => {
            notify.success(gettext('Set updated successfully'));

            return set;
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to update the Set'));
            console.error(error);

            return Promise.reject(error);
        });
}

export function deleteSet(superdesk: ISuperdesk, item: ISetItem): Promise<void> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.delete<ISetItem>(RESOURCE, item)
        .then(() => {
            notify.success(gettext('Set deleted successfully'));
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to delete the Set'));
            console.error(error);

            return Promise.reject(error);
        });
}
