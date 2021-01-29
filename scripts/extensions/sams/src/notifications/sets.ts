import {getStore} from '../../src/store';
import {loadSets, closeSetContentPanel} from '../../src/store/sets/actions';
import {superdeskApi} from '../../src/apis';

export function onSetCreated() {
    const store = getStore();

    store?.dispatch<any>(loadSets());
}

export function onSetUpdated(event: any) {
    const {notify} = superdeskApi.ui;
    const store = getStore();
    const user_id = superdeskApi.session.getCurrentUserId();

    store?.dispatch<any>(loadSets());
    if (user_id !== event.detail.extra.user_id) {
        const item_id = store?.getState().sets.selectedSetId;

        if (item_id === event.detail.extra.item_id) {
            store?.dispatch(closeSetContentPanel());
            notify.info('Set was updated by another user.');
        }
    }
}

export function onSetDeleted(event: any) {
    const {notify} = superdeskApi.ui;
    const store = getStore();
    const user_id = superdeskApi.session.getCurrentUserId();

    store?.dispatch<any>(loadSets());
    if (user_id !== event.detail.extra.user_id) {
        const item_id = store?.getState().sets.selectedSetId;

        if (item_id === event.detail.extra.item_id) {
            store?.dispatch(closeSetContentPanel());
            notify.info('Set was deleted by another user.');
        }
    }
}
