import {getStore} from '../../src/store';
import {loadSets, previewSet, closeSetContentPanel} from '../../src/store/sets/actions';
import {superdeskApi} from '../../src/apis';

export function onSetCreated() {
    const store = getStore();
    store?.dispatch<any>(loadSets());
}

export function onSetUpdated(event: any) {
    const {notify} = superdeskApi.ui;

    const store = getStore();
    store?.dispatch<any>(loadSets());

    const user_id = superdeskApi.session.getCurrentUserId();
    if (user_id !== event.detail.extra.user_id) {
        store?.dispatch(previewSet(event.detail.extra.item_id))
        notify.info('Set was updated by another user.')
    }
}

export function onSetDeleted(event: any) {
    const {notify} = superdeskApi.ui;

    const store = getStore();
    store?.dispatch<any>(loadSets());

    const user_id = superdeskApi.session.getCurrentUserId();
    if (user_id !== event.detail.extra.user_id) {
        store?.dispatch(closeSetContentPanel())
        notify.info('Set was deleted by another user.')
    }
}
