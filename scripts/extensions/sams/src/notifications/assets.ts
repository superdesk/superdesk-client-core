import {getStore} from '../store';
import {
    closeAssetContentPanel,
    reloadAssetList,
    updateSelectedAssetIds,
    sessionUnlock,
    loadAssetsByIds,
} from '../store/assets/actions';
import {superdeskApi} from '../../src/apis';
import {ISAMSWebsocketEvent} from '../interfaces';
import {
    getAssetListItemIds,
    getSelectedAssetId,
    getSelectedAssetIds,
} from '../store/assets/selectors';

export function onAssetCreated() {
    const store = getStore();

    store?.dispatch<any>(reloadAssetList());
}

export function onAssetUpdated() {
    const store = getStore();

    store?.dispatch<any>(reloadAssetList());
}

export function onAssetDeleted(event: ISAMSWebsocketEvent) {
    const {notify} = superdeskApi.ui;
    const {gettext} = superdeskApi.localization;
    const store = getStore();
    const user_id = superdeskApi.session.getCurrentUserId();
    const item_id = event.detail.extra.item_id!;
    const selectedAssetId = getSelectedAssetId(store?.getState());
    const selectedAssetIds = getSelectedAssetIds(store?.getState());

    store?.dispatch<any>(reloadAssetList());

    if (selectedAssetId === item_id) {
        store?.dispatch(closeAssetContentPanel());
        if (user_id !== event.detail.extra.user_id) {
            notify.info(gettext('Asset was deleted by another user.'));
        }
    }

    if (selectedAssetIds.includes(item_id)) {
        store?.dispatch(updateSelectedAssetIds(item_id!));
    }
}

export function onAssetLocked(event: ISAMSWebsocketEvent) {
    const store = getStore();
    const item_id = event.detail.extra.item_id!;
    const assetItemIds = getAssetListItemIds(store?.getState());

    if (assetItemIds.includes(item_id)) {
        store?.dispatch<any>(loadAssetsByIds([item_id]));
    }
}

export function onAssetUnlocked(event: ISAMSWebsocketEvent) {
    const store = getStore();
    const item_id = event.detail.extra.item_id!;
    const assetItemIds = getAssetListItemIds(store?.getState());

    if (assetItemIds.includes(item_id)) {
        store?.dispatch<any>(loadAssetsByIds([item_id]));
    }
}

export function onSessionUnlocked(event: ISAMSWebsocketEvent) {
    const store = getStore();
    const session_id = event.detail.extra.session_id;

    store?.dispatch<any>(sessionUnlock(session_id));
}
