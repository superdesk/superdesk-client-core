// Types
import {IRestApiResponse} from 'superdesk-api';
import {
    ASSET_LIST_STYLE,
    IAssetItem,
    IAssetSearchParams,
    LIST_ACTION,
} from '../../interfaces';
import {IThunkAction} from '../types';
import {
    ASSET_SET_LIST_STYLE,
    IAssetActionTypes,
    RECEIVE_ASSETS,
    SET_ASSET_SEARCH_PARAMS,
    MANAGE_ASSETS_PREVIEW,
    MANAGE_ASSETS_CLOSE_PREVIEW_PANEL,
} from './types';

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

export function previewAsset(asset: string): IAssetActionTypes {
    return {
        type: MANAGE_ASSETS_PREVIEW,
        payload: asset,
    };
}

export function closeAssetPreviewPanel(): IAssetActionTypes {
    return {
        type: MANAGE_ASSETS_CLOSE_PREVIEW_PANEL,
    };
}

export function queryAssets(params: IAssetSearchParams, listAction?: LIST_ACTION): IThunkAction<void> {
    return (dispatch, getState, {api}) => {
        return api.assets.query(params, getAssetListStyle(getState()))
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
    return (dispatch, getState, {api}) => {
        if (listAction === LIST_ACTION.REPLACE) {
            dispatch(setAssetSearchParams({
                ...params,
                page: 1,
            }));
        } else {
            dispatch(setAssetSearchParams(params));
        }

        api.assets.setSearchUrlParams(getAssetSearchParams(getState()));

        return dispatch(queryAssetsFromCurrentSearch(listAction));
    };
}

export function updateAssetSearchParamsAndListItemsFromURL(listAction?: LIST_ACTION): IThunkAction<void> {
    return (dispatch, _getState, {api}) => {
        const searchParams = api.assets.getSearchUrlParams();

        if (Object.keys(searchParams).length > 0) {
            dispatch(setAssetSearchParams(searchParams));
        }

        return dispatch(queryAssetsFromCurrentSearch(listAction));
    };
}
