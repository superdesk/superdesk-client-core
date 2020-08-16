// Types
import {ISuperdesk} from 'superdesk-api';
import {ISetItem} from '../../interfaces';
import {IThunkAction} from '../types';

// Redux Selectors
import {getSelectedSetId} from './selectors';

import {
    ISetActionTypes,
    RECEIVE_SETS,
    UPDATE_SET_IN_STORE,
    REMOVE_SET_IN_STORE,
    MANAGE_SETS_EDIT,
    MANAGE_SETS_PREVIEW,
    MANAGE_SETS_CLOSE_CONTENT_PANEL,
    MANAGE_SETS_RESET,
} from './types';

export function receiveSets(sets: Array<ISetItem>): ISetActionTypes {
    return {
        type: RECEIVE_SETS,
        payload: sets,
    };
}

export function updatedSetInStore(set: ISetItem): ISetActionTypes {
    return {
        type: UPDATE_SET_IN_STORE,
        payload: set,
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

export function loadSets(): IThunkAction<Array<ISetItem>> {
    return (dispatch, _getState, {api}) => {
        return api.sets.getAll()
            .then((sets: Array<ISetItem>) => {
                dispatch(receiveSets(sets));

                return Promise.resolve(sets);
            });
    };
}

function openDeleteConfirmationModal(superdesk: ISuperdesk, set: ISetItem): Promise<boolean> {
    const {gettext} = superdesk.localization;
    const {confirm} = superdesk.ui;

    const el = document.createElement('div');

    // FIXME: Add an extra backdrop that will cover the Manage Sets modal
    // This is required because the ui-framework calculates z-index
    // based on the number of active modals, where as we're using
    // a mixture of the ui-framework and pure React modals
    // (superdesk.ui.showModal vs superdesk.ui.confirm)
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
    return (dispatch, getState, {superdesk, api}) => {
        return openDeleteConfirmationModal(superdesk, set)
            .then((response: boolean) => {
                if (response === true) {
                    return api.sets.delete(set)
                        .then(() => {
                            dispatch(removeSetInStore(set));

                            if (getSelectedSetId(getState()) === set._id) {
                                dispatch(closeSetContentPanel());
                            }
                        });
                }

                return Promise.resolve();
            });
    };
}

export function updateSet(original: ISetItem, updates: Partial<ISetItem>): IThunkAction<ISetItem> {
    return (dispatch, _getState, {api}) => {
        return api.sets.update(original, updates)
            .then((updatedSet: ISetItem) => {
                dispatch(updatedSetInStore(updatedSet));
                dispatch(previewSet(updatedSet._id));

                return updatedSet;
            });
    };
}

export function createSet(item: Partial<ISetItem>): IThunkAction<ISetItem> {
    return (dispatch, _getState, {api}) => {
        return api.sets.create(item)
            .then((newSet: ISetItem) => {
                dispatch(loadSets());
                dispatch(previewSet(newSet._id));

                return newSet;
            });
    };
}
