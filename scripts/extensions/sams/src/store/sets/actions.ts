// Types
import {ISetItem} from '../../interfaces';
import {IThunkAction} from '../types';
import {superdeskApi, samsApi} from '../../apis';

// Redux Selectors
import {getSelectedSetId} from './selectors';

import {
    ISetActionTypes,
    RECEIVE_SETS,
    REMOVE_SET_IN_STORE,
    MANAGE_SETS_EDIT,
    MANAGE_SETS_PREVIEW,
    MANAGE_SETS_CLOSE_CONTENT_PANEL,
    MANAGE_SETS_RESET,
    RECEIVE_ASSETS_COUNT,
} from './types';

export function receiveSets(sets: Array<ISetItem>): ISetActionTypes {
    return {
        type: RECEIVE_SETS,
        payload: sets,
    };
}

export function removeSetInStore(set: ISetItem): ISetActionTypes {
    return {
        type: REMOVE_SET_IN_STORE,
        payload: set,
    };
}

export function editSet(setId?: string): ISetActionTypes {
    return {
        type: MANAGE_SETS_EDIT,
        payload: setId,
    };
}

export function previewSet(setId: string): ISetActionTypes {
    return {
        type: MANAGE_SETS_PREVIEW,
        payload: setId,
    };
}

export function closeSetContentPanel(): ISetActionTypes {
    return {
        type: MANAGE_SETS_CLOSE_CONTENT_PANEL,
    };
}

export function onManageSetsModalClosed(): ISetActionTypes {
    return {
        type: MANAGE_SETS_RESET,
    };
}

export function receiveAssetsCount(counts: Dictionary<string, number>): ISetActionTypes {
    return {
        type: RECEIVE_ASSETS_COUNT,
        payload: counts,
    };
}

export function loadSets(): IThunkAction<Array<ISetItem>> {
    return (dispatch) => {
        return samsApi.sets.getAll()
            .then((sets: Array<ISetItem>) => {
                const setIds: Array<string> = sets.map((set) => {
                    return set._id;
                });

                dispatch(receiveSets(sets));
                return dispatch(loadAssetsCount(setIds))
                    .then(() => sets);
            });
    };
}

export function loadAssetsCount(setIds: Array<string>): IThunkAction<Dictionary<string, number>> {
    return (dispatch) => {
        return samsApi.assets.getCount(setIds)
            .then((counts: Dictionary<string, number>) => {
                dispatch(receiveAssetsCount(counts));
                return Promise.resolve(counts);
            });
    };
}

function openDeleteConfirmationModal(set: ISetItem): Promise<boolean> {
    const {gettext} = superdeskApi.localization;
    const {confirm} = superdeskApi.ui;

    const el = document.createElement('div');

    // FIXME: Add an extra backdrop that will cover the Manage Sets modal
    // This is required because the ui-framework calculates z-index
    // based on the number of active modals, where as we're using
    // a mixture of the ui-framework and pure React modals
    // (superdeskApi.ui.showModal vs superdeskApi.ui.confirm)
    el.classList.add('modal__backdrop', 'fade', 'in');
    el.style.zIndex = '1050';
    document.body.append(el);

    return confirm(
        gettext('Are you sure you want to delete the Set "{{name}}"?', {name: set.name}),
        gettext('Delete Set?'),
    )
        .then((response: boolean) => {
            el.remove();
            return response;
        });
}

export function confirmBeforeDeletingSet(set: ISetItem): IThunkAction<void> {
    return (dispatch, getState) => {
        return openDeleteConfirmationModal(set)
            .then((response: boolean) => {
                if (response === true) {
                    return samsApi.sets.delete(set)
                        .then(() => {
                            if (getSelectedSetId(getState()) === set._id) {
                                dispatch(closeSetContentPanel());
                            }
                        });
                }

                return Promise.resolve();
            });
    };
}
