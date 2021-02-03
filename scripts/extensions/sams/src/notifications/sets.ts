// Types
import {superdeskApi} from '../apis';
import {ISAMSWebsocketEvent, ISetItem} from '../interfaces';
import {getStore} from '../store';

// Redux Actions & Selectors
import {loadSets, closeSetContentPanel, removeSetInStore} from '../store/sets/actions';
import {getSets, getSelectedSetId} from '../store/sets/selectors';

export function onSetCreated() {
    const store = getStore();

    store?.dispatch<any>(loadSets());
}

export function onSetUpdated(event: ISAMSWebsocketEvent) {
    const {notify} = superdeskApi.ui;
    const {gettext} = superdeskApi.localization;
    const store = getStore();
    const user_id = superdeskApi.session.getCurrentUserId();

    store?.dispatch<any>(loadSets());
    if (user_id !== event.detail.extra.user_id) {
        const item_id = getSelectedSetId(store?.getState());

        if (item_id === event.detail.extra.item_id) {
            store?.dispatch(closeSetContentPanel());
            notify.info(gettext('Set was updated by another user.'));
        }
    }
}

export function onSetDeleted(event: ISAMSWebsocketEvent) {
    const {notify} = superdeskApi.ui;
    const {gettext} = superdeskApi.localization;
    const store = getStore();
    const user_id = superdeskApi.session.getCurrentUserId();
    const sets = getSets(store?.getState());

    sets.forEach((element: ISetItem) => {
        if (element._id === event.detail.extra.item_id) {
            store?.dispatch(removeSetInStore(element));
        }
    });
    if (user_id !== event.detail.extra.user_id) {
        const item_id = getSelectedSetId(store?.getState());

        if (item_id === event.detail.extra.item_id) {
            store?.dispatch(closeSetContentPanel());
            notify.info(gettext('Set was deleted by another user.'));
        }
    }
}
