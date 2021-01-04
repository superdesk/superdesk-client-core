// Types
import {IRestApiResponse} from 'superdesk-api';
import {ASSET_LIST_STYLE, IAssetItem, IAssetSearchParams, LIST_ACTION} from '../../interfaces';
import {IThunkAction} from '../types';
import {
    ASSET_SET_LIST_STYLE,
    IAssetActionTypes,
    RECEIVE_ASSETS,
    SET_ASSET_SEARCH_PARAMS,
    MANAGE_ASSETS_PREVIEW,
    MANAGE_ASSETS_CLOSE_CONTENT_PANEL,
    UPDATE_SELECTED_ASSET_IDS,
    MANAGE_MULTIACTIONBAR_CLOSE,
    MANAGE_ASSETS_EDIT,
    MANAGE_ASSET_UPDATE_IN_STORE,
} from './types';
import {samsApi} from '../../apis';

// Redux Selectors
import {
    getAssetListStyle,
    getAssetSearchParams,
    getSelectedAssetId,
    getSelectedAssetIds,
    getSelectedAssetItems,
    getAssets,
} from './selectors';

// Utils
import {verifyAssetBeforeLocking} from '../../utils/assets';

export function receiveAssets(
    response: IRestApiResponse<IAssetItem>,
    listAction?: LIST_ACTION,
): IAssetActionTypes {
    return {
        type: RECEIVE_ASSETS,
        payload: {
            response: response,
            listAction: listAction,
        },
    };
}

export function setAssetSearchParams(params: Partial<IAssetSearchParams>): IAssetActionTypes {
    return {
        type: SET_ASSET_SEARCH_PARAMS,
        payload: params,
    };
}

export function setAssetListStyle(style: ASSET_LIST_STYLE): IAssetActionTypes {
    return {
        type: ASSET_SET_LIST_STYLE,
        payload: style,
    };
}

export function toggleAssetListStyle(): IThunkAction<void> {
    return (dispatch, getState) => {
        dispatch(setAssetListStyle(
            getAssetListStyle(getState()) === ASSET_LIST_STYLE.GRID ?
                ASSET_LIST_STYLE.LIST :
                ASSET_LIST_STYLE.GRID,
        ));

        return dispatch<any>(queryAssetsFromCurrentSearch());
    };
}

export function previewAsset(asset_id: string): IAssetActionTypes {
    return {
        type: MANAGE_ASSETS_PREVIEW,
        payload: asset_id,
    };
}

export function closeAssetContentPanel(): IAssetActionTypes {
    return {
        type: MANAGE_ASSETS_CLOSE_CONTENT_PANEL,
    };
}

export function updateSelectedAssetIds(asset_id: string): IAssetActionTypes {
    return {
        type: UPDATE_SELECTED_ASSET_IDS,
        payload: asset_id,
    };
}

export function closeMultiActionBar(): IAssetActionTypes {
    return {
        type: MANAGE_MULTIACTIONBAR_CLOSE,
    };
}

export function queryAssets(params: IAssetSearchParams, listAction?: LIST_ACTION): IThunkAction<void> {
    return (dispatch, getState) => {
        return samsApi.assets.query(params, getAssetListStyle(getState()))
            .then((response) => {
                dispatch(
                    receiveAssets(
                        response,
                        listAction,
                    ),
                );
            });
    };
}

export function queryAssetsFromCurrentSearch(listAction?: LIST_ACTION): IThunkAction<void> {
    return (dispatch, getState) => {
        const params = getAssetSearchParams(getState());

        return dispatch(queryAssets(params, listAction));
    };
}

export function loadNextAssetsPage(): IThunkAction<void> {
    return (dispatch, getState) => {
        const params = getAssetSearchParams(getState());

        params.page += 1;
        return dispatch(queryAssets(params, LIST_ACTION.APPEND));
    };
}

export function updateAssetSearchParamsAndListItems(
    params: Partial<IAssetSearchParams>,
    listAction?: LIST_ACTION,
): IThunkAction<void> {
    return (dispatch, getState) => {
        if (listAction === LIST_ACTION.REPLACE) {
            dispatch(setAssetSearchParams({
                ...params,
                page: 1,
            }));
        } else {
            dispatch(setAssetSearchParams(params));
        }

        samsApi.assets.setSearchUrlParams(getAssetSearchParams(getState()));

        return dispatch(queryAssetsFromCurrentSearch(listAction));
    };
}

export function updateAssetSearchParamsAndListItemsFromURL(listAction?: LIST_ACTION): IThunkAction<void> {
    return (dispatch, _getState) => {
        const searchParams = samsApi.assets.getSearchUrlParams();

        if (Object.keys(searchParams).length > 0) {
            dispatch(setAssetSearchParams(searchParams));
        }

        return dispatch(queryAssetsFromCurrentSearch(listAction));
    };
}

export function updateAssetInStore(asset: Partial<IAssetItem>, assetId: string): IAssetActionTypes {
    return {
        type: MANAGE_ASSET_UPDATE_IN_STORE,
        payload: {
            asset: asset,
            assetId: assetId,
        },
    };
}

export function editAsset(assetId?: string): IAssetActionTypes {
    return {
        type: MANAGE_ASSETS_EDIT,
        payload: assetId,
    };
}

export function unlockAsset(asset: IAssetItem): IThunkAction<Partial<IAssetItem>> {
    return (dispatch, getState) => {
        return samsApi.assets.unlockAsset(asset, {})
            .then((unlockedAsset: Partial<IAssetItem>) => {
                dispatch(updateAssetInStore(unlockedAsset, asset._id));
                const getassets = getAssets(getState());

                return getassets[asset._id];
            });
    };
}

export function forceUnlockAsset(asset: IAssetItem): IThunkAction<Partial<IAssetItem>> {
    return (dispatch, getState) => {
        return samsApi.assets.unlockAsset(asset, {'force': true})
            .then((unlockedAsset: Partial<IAssetItem>) => {
                dispatch(updateAssetInStore(unlockedAsset, asset._id));
                const getassets = getAssets(getState());

                return getassets[asset._id];
            });
    };
}

export function lockAsset(asset: IAssetItem): (dispatch: any, getState: any) =>
    Promise<void | IAssetItem | Partial<IAssetItem>> {
    return (dispatch, getState) => {
        if (verifyAssetBeforeLocking(asset, 'edit')) {
            return Promise.resolve();
        } else {
            return samsApi.assets.lockAsset(asset, {'lock_action': 'edit'})
                .then((lockedAsset: Partial<IAssetItem>) => {
                    dispatch(updateAssetInStore(lockedAsset, asset._id));
                    const getassets = getAssets(getState());

                    return getassets[asset._id];
                });
        }
    };
}

export function onEditAsset(asset: IAssetItem): (dispatch: any) => void {
    return (dispatch) => {
        dispatch(lockAsset(asset))
            .then(() => {
                dispatch(editAsset(asset._id));
            });
    };
}

export function updateAsset(original: IAssetItem, updates: Partial<IAssetItem>): IThunkAction<IAssetItem> {
    return (dispatch) => {
        return samsApi.assets.update(original, updates)
            .then((updatedAsset: IAssetItem) => {
                // Wait for the Assets to update before returning the updated Asset
                dispatch(updateAssetInStore(updatedAsset, updatedAsset._id));
                return updatedAsset;
            });
    };
}

export function deleteAsset(asset: IAssetItem): IThunkAction<void> {
    return (dispatch, getState) => {
        const selectedAssetId = getSelectedAssetId(getState());
        const selectedAssetIds = getSelectedAssetIds(getState());

        return samsApi.assets.deleteAsset(asset)
            .then(() => {
                dispatch(queryAssetsFromCurrentSearch(LIST_ACTION.REPLACE));
                if (selectedAssetId === asset._id) {
                    dispatch(closeAssetContentPanel());
                }
                if (selectedAssetIds.indexOf(asset._id) !== -1) {
                    dispatch(updateSelectedAssetIds(asset._id));
                }
            });
    };
}

export function deleteMultipleAssets(): (dispatch: any, getState: any) => void {
    return (dispatch, getState) => {
        const selectedAssets = getSelectedAssetItems(getState());

        selectedAssets.map((selectedAsset) =>
            dispatch(deleteAsset(selectedAsset))
                .then(() => {
                    dispatch(closeMultiActionBar());
                }),
        );
    };
}

export function loadAssetsByIds(ids: Array<string>): IThunkAction<void> {
    return (dispatch, getState) => {
        const loadedAssetIds = Object.keys(getAssets(getState()));
        const attachmentsToLoad = ids.filter(
            (id) => !loadedAssetIds.includes(id),
        );

        if (attachmentsToLoad.length === 0) {
            return Promise.resolve();
        }

        return samsApi.assets.getByIds(attachmentsToLoad)
            .then((response) => {
                dispatch(receiveAssets(response));
            });
    };
}
