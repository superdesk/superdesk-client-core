import {ISuperdesk, IRestApiResponse} from 'superdesk-api';
import {ISet, ISetItem} from '../interfaces';
import {EVENTS} from '../constants';

const RESOURCE = 'sams/sets';

export function getAllSets(superdesk: ISuperdesk): Promise<Array<ISetItem>> {
    return superdesk.dataApi.query<ISetItem>(
        RESOURCE,
        1,
        {field: 'name', direction: 'ascending'},
        {},
    )
        .then((response: IRestApiResponse<ISetItem>) => {
            return response?._items ?? [];
        });
}

export function createSet(superdesk: ISuperdesk, item: ISet): Promise<ISetItem> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.create<ISetItem>(RESOURCE, item as ISetItem)
        .then((set: ISetItem) => {
            notify.success(gettext('Set created successfully'));

            window.dispatchEvent(
                new CustomEvent(
                    EVENTS.SET_CREATED,
                    {detail: set},
                ),
            );

            return set;
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to create the Set'));

            throw new Error(error);
        });
}

export function updateSet(superdesk: ISuperdesk, original: ISetItem, updates: ISet): Promise<ISetItem> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.patch<ISetItem>(RESOURCE, original, updates as ISetItem)
        .then((set: ISetItem) => {
            notify.success(gettext('Set updated successfully'));

            window.dispatchEvent(
                new CustomEvent(
                    EVENTS.SET_UPDATED,
                    {detail: set},
                ),
            );

            return set;
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to update the Set'));

            throw new Error(error);
        });
}

export function deleteSet(superdesk: ISuperdesk, item: ISetItem): Promise<void> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.delete<ISetItem>(RESOURCE, item)
        .then(() => {
            notify.success(gettext('Set deleted successfully'));

            window.dispatchEvent(
                new CustomEvent(
                    EVENTS.SET_DELETED,
                    {detail: item},
                ),
            );
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to delete the Set'));

            throw new Error(error);
        });
}

export function confirmBeforeDeletingSet(superdesk: ISuperdesk, set: ISetItem): Promise<void> {
    const {gettext} = superdesk.localization;
    const {confirm} = superdesk.ui;

    return confirm(
        gettext('Are you sure you want to delete the Set "{{name}}"?', {name: set.name ?? ''}),
        gettext('Delete Set?'),
    )
        .then((response: boolean) => {
            if (response === true) {
                return deleteSet(superdesk, set);
            }

            return Promise.resolve();
        });
}
