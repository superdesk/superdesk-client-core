// Types
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
    MANAGE_SETS_DELETE_CONFIRMATION_OPEN,
    MANAGE_SETS_ON_CLOSED,
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
        paylaod: set,
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

export function setDeleteConfirmationModalOpen(open: boolean): ISetActionTypes {
    return {
        type: MANAGE_SETS_DELETE_CONFIRMATION_OPEN,
        payload: open,
    };
}

export function onManageSetsModalClosed(): ISetActionTypes {
    return {
        type: MANAGE_SETS_ON_CLOSED,
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

export function openDeleteConfirmationModal(set: ISetItem): IThunkAction<boolean> {
    return (dispatch, _getState, {superdesk}) => {
        const {gettext} = superdesk.localization;
        const {confirm} = superdesk.ui;

        dispatch(setDeleteConfirmationModalOpen(true));

        return confirm(
            gettext('Are you sure you want to delete the Set "{{name}}"?', {name: set.name}),
            gettext('Delete Set?'),
        )
            .then((response: boolean) => {
                dispatch(setDeleteConfirmationModalOpen(false));
                return response;
            });
    };
}

export function confirmBeforeDeletingSet(set: ISetItem): IThunkAction<void> {
    return (dispatch, getState, {api}) => {
        return dispatch(openDeleteConfirmationModal(set))
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
