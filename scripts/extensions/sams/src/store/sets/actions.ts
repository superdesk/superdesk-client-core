// Types
import {ISetItem, IThunkAction} from '../../interfaces';

// Redux Selectors
import {getSelectedSetId} from './selectors';

import {setsBranch} from './branch';

export function loadSets(): IThunkAction<Array<ISetItem>> {
    return (dispatch, _getState, {api}) => {
        return api.sets.getAll()
            .then((sets: Array<ISetItem>) => {
                dispatch(setsBranch.receive.action(sets));

                return Promise.resolve(sets);
            });
    };
}

export function openDeleteConfirmationModal(set: ISetItem): IThunkAction<boolean> {
    return (_dispatch, _getState, {superdesk}) => {
        const {gettext} = superdesk.localization;
        const {confirm} = superdesk.ui;

        const el = document.createElement('div');

        // Add an extra backdrop that will cover the Manage Sets modal
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
    };
}

export function confirmBeforeDeletingSet(set: ISetItem): IThunkAction<void> {
    return (dispatch, getState, {api}) => {
        return dispatch(openDeleteConfirmationModal(set))
            .then((response: boolean) => {
                if (response === true) {
                    return api.sets.delete(set)
                        .then(() => {
                            dispatch(setsBranch.removeSet.action(set));

                            if (getSelectedSetId(getState()) === set._id) {
                                dispatch(setsBranch.closeContentPanel.action());
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
                dispatch(setsBranch.updateSet.action(updatedSet));
                dispatch(setsBranch.previewSet.action(updatedSet._id));

                return updatedSet;
            });
    };
}

export function createSet(item: Partial<ISetItem>): IThunkAction<ISetItem> {
    return (dispatch, _getState, {api}) => {
        return api.sets.create(item)
            .then((newSet: ISetItem) => {
                dispatch(loadSets());
                dispatch(setsBranch.previewSet.action(newSet._id));

                return newSet;
            });
    };
}
