// Types
import {IDesk} from 'superdesk-api';
import {ISetItem} from '../interfaces';
import {superdeskApi} from '../apis';

// Redux
import {getStoreSync} from '../store';
import {getDesksAllowedSets} from '../store/workspace/selectors';

export function getDesksSamsSettings(): Promise<Dictionary<IDesk['_id'], IDesk['sams_settings']>> {
    return superdeskApi.dataApi.query<IDesk>(
        'desks',
        1,
        {field: '_id', direction: 'ascending'},
        {},
    )
        .then((response) => {
            return response._items.reduce<Dictionary<IDesk['_id'], IDesk['sams_settings']>>(
                (items, desk) => {
                    items[desk._id] = desk.sams_settings ?? {};

                    return items;
                },
                {},
            );
        });
}

export function getSingleDeskSamsSettings(deskId: IDesk['_id']): Promise<IDesk['sams_settings']> {
    return superdeskApi.dataApi.findOne<IDesk>('desks', deskId)
        .then((desk) => {
            return desk.sams_settings ?? {};
        });
}

export function updateSetsAllowedDesks(setId: ISetItem['_id'], allowedDesks: Array<IDesk['_id']>): Promise<void> {
    const store = getStoreSync();
    const currentlyAllowed: Array<IDesk['_id']> = getDesksAllowedSets(store.getState())[setId] ?? [];
    const toRemove = currentlyAllowed.filter(
        (deskId) => !allowedDesks.includes(deskId),
    );
    const toAdd = allowedDesks.filter(
        (deskId) => !currentlyAllowed.includes(deskId),
    );

    return superdeskApi.dataApi.query<IDesk>(
        'desks',
        1,
        {field: '_id', direction: 'ascending'},
        {
            _id: {
                $in: [
                    ...toAdd,
                    ...toRemove,
                ],
            },
        },
    )
        .then((response) => {
            return Promise.all(response._items.map(
                (original) => {
                    const samsSettings: IDesk['sams_settings'] = {
                        ...original.sams_settings ?? {},
                        allowed_sets: [...original.sams_settings?.allowed_sets ?? []],
                    };

                    if (!samsSettings.allowed_sets?.length) {
                        samsSettings.allowed_sets = [];
                    }

                    if (toAdd.includes(original._id)) {
                        samsSettings.allowed_sets.push(setId);
                    } else {
                        samsSettings.allowed_sets = samsSettings.allowed_sets.filter(
                            (sId) => sId !== setId,
                        );
                    }

                    return superdeskApi.dataApi.patch<IDesk>(
                        'desks',
                        original,
                        {sams_settings: samsSettings},
                    );
                },
            ))
                .then(() => Promise.resolve());
        });
}
