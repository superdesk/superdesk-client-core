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
} from './types';
import {samsApi} from '../../apis';

// Redux Selectors
import {getAssetListStyle, getAssetSearchParams} from './selectors';

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

export function editAsset(assetId?: string): IAssetActionTypes {
    return {
        type: MANAGE_ASSETS_EDIT,
        payload: assetId,
    };
}

export function updateAsset(original: IAssetItem, updates: Partial<IAssetItem>): IThunkAction<IAssetItem> {
    return (dispatch) => {
        return samsApi.assets.update(original, updates)
            .then((updatedAsset: IAssetItem) => {
                // Wait for the Assets to update before returning the updated Asset
                return dispatch(queryAssetsFromCurrentSearch())
                    .then(() => updatedAsset);
            });
    };
}

export function deleteAsset(asset: IAssetItem): IThunkAction<void> {
    return (dispatch) => {
        return samsApi.assets.deleteAsset(asset)
            .then(() => {
                dispatch(queryAssetsFromCurrentSearch(LIST_ACTION.REPLACE));
                dispatch(closeAssetContentPanel());
            });
    };
}
