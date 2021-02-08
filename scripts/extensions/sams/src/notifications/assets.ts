import {getStore} from '../store';
import {receiveAssets} from '../store/assets/actions';
import {
    closeAssetContentPanel,
    queryAssetsFromCurrentSearch,
    updateSelectedAssetIds,
    sessionUnlock,
    loadAssetsByIds,
} from '../store/assets/actions';
import {superdeskApi, samsApi} from '../../src/apis';
import {ISAMSWebsocketEvent, LIST_ACTION, IAssetItem} from '../interfaces';
import {
    getAssetSearchParams,
    getAssetListStyle,
    getAssetListItemIds,
    getSelectedAssetId,
    getSelectedAssetIds,
} from '../store/assets/selectors';

export function onAssetCreated(event: ISAMSWebsocketEvent) {
    const store = getStore();
    const item_id = event.detail.extra.item_id!;
    const params = getAssetSearchParams(store?.getState());
    const listStyle = getAssetListStyle(store?.getState());

    return samsApi.assets.query(params, listStyle)
        .then((response) => {
            response._items.forEach((element: IAssetItem) => {
                if (element._id === item_id) {
                    store?.dispatch(
                        receiveAssets(
                            response,
                            LIST_ACTION.REPLACE,
                        ),
                    );
                }
            });
        });
}

export function onAssetUpdated() {
    const store = getStore();

    store?.dispatch<any>(queryAssetsFromCurrentSearch(LIST_ACTION.REPLACE));
}

export function onAssetDeleted(event: ISAMSWebsocketEvent) {
    const {notify} = superdeskApi.ui;
    const {gettext} = superdeskApi.localization;
    const store = getStore();
    const user_id = superdeskApi.session.getCurrentUserId();
    const item_id = event.detail.extra.item_id!;
    const assetItemIds = getAssetListItemIds(store?.getState());
    const selectedAssetId = getSelectedAssetId(store?.getState());
    const selectedAssetIds = getSelectedAssetIds(store?.getState());

    if (assetItemIds.includes(item_id)) {
        store?.dispatch<any>(queryAssetsFromCurrentSearch(LIST_ACTION.REPLACE));
    }

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
