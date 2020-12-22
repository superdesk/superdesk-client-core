// Types
import {IRestApiResponse} from 'superdesk-api';
import {
    ASSET_LIST_STYLE,
    ASSET_SORT_FIELD,
    ASSET_TYPE_FILTER,
    IAssetItem,
    IAssetSearchParams,
    LIST_ACTION,
    SORT_ORDER,
    ASSET_CONTENT_PANEL_STATE,
} from '../../interfaces';
import {
    ASSET_SET_LIST_STYLE,
    IAssetActionTypes,
    IAssetState,
    RECEIVE_ASSETS,
    SET_ASSET_SEARCH_PARAMS,
    MANAGE_ASSETS_PREVIEW,
    MANAGE_ASSETS_CLOSE_CONTENT_PANEL,
    UPDATE_SELECTED_ASSET_IDS,
    MANAGE_MULTIACTIONBAR_CLOSE,
    MANAGE_ASSETS_EDIT,
    MANAGE_ASSET_UPDATE_IN_STORE,
} from './types';

const initialState: IAssetState = {
    assets: {},
    searchParams: {
        page: 1,
        mimetypes: ASSET_TYPE_FILTER.ALL,
        sortField: ASSET_SORT_FIELD.NAME,
        sortOrder: SORT_ORDER.ASCENDING,
    },
    listItemIds: [],
    searchResultTotal: 0,
    contentPanelState: ASSET_CONTENT_PANEL_STATE.CLOSED,
    listStyle: ASSET_LIST_STYLE.GRID,
    selectedAssetId: undefined,
    selectedAssetIds: [],
};

export function assetsReducer(
    state: IAssetState = initialState,
    action: IAssetActionTypes,
): IAssetState {
    switch (action.type) {
    case RECEIVE_ASSETS:
        return receiveAssets(state, action.payload);
    case SET_ASSET_SEARCH_PARAMS:
        return updateSearchParams(state, action.payload);
    case MANAGE_ASSETS_PREVIEW:
        return {
            ...state,
            contentPanelState: ASSET_CONTENT_PANEL_STATE.PREVIEW,
            selectedAssetId: action.payload,
        };
    case MANAGE_ASSETS_CLOSE_CONTENT_PANEL:
        return {
            ...state,
            contentPanelState: ASSET_CONTENT_PANEL_STATE.CLOSED,
            selectedAssetId: undefined,
        };
    case UPDATE_SELECTED_ASSET_IDS:
        return manageAssetsInSelectedAssetsArray(state, action.payload);
    case MANAGE_MULTIACTIONBAR_CLOSE:
        return {
            ...state,
            selectedAssetIds: [],
        };
    case ASSET_SET_LIST_STYLE:
        return {
            ...state,
            listStyle: action.payload,
        };
    case MANAGE_ASSETS_EDIT:
        return {
            ...state,
            contentPanelState: ASSET_CONTENT_PANEL_STATE.EDIT,
            selectedAssetId: action.payload,
        };
    case MANAGE_ASSET_UPDATE_IN_STORE:
        return updateAssetInStore(state, action.payload);
    default:
        return state;
    }
}

function receiveAssets(
    prevState: IAssetState,
    payload: {
        response: IRestApiResponse<IAssetItem>,
        listAction?: LIST_ACTION,
    },
): IAssetState {
    const newState = {...prevState};
    const assets = payload.response._items.reduce(
        (items, asset) => {
            items[asset._id] = asset;

            return items;
        },
        {} as Dictionary<string, IAssetItem>,
    );

    newState.assets = {
        ...prevState.assets,
        ...assets,
    };

    if (payload.listAction != null) {
        const assetIds = payload.response._items.map(
            (asset) => asset._id,
        );

        if (payload.listAction === LIST_ACTION.APPEND) {
            newState.listItemIds = newState.listItemIds.concat(assetIds);
        } else if (payload.listAction === LIST_ACTION.REPLACE) {
            newState.listItemIds = assetIds;
        }

        newState.searchResultTotal = payload.response._meta.total;
    }

    return newState;
}

function updateSearchParams(prevState: IAssetState, params: Partial<IAssetSearchParams>): IAssetState {
    const newState = {...prevState};

    newState.searchParams = {
        ...prevState.searchParams,
        ...params,
        page: params.page ?? prevState.searchParams.page ?? 1,
        mimetypes: params.mimetypes ?? prevState.searchParams.mimetypes ?? ASSET_TYPE_FILTER.ALL,
        sortField: params.sortField ?? prevState.searchParams.sortField ?? ASSET_SORT_FIELD.NAME,
        sortOrder: params.sortOrder ?? prevState.searchParams.sortOrder ?? SORT_ORDER.ASCENDING,
    };

    return newState;
}

function manageAssetsInSelectedAssetsArray(prevState: IAssetState, payload: string): IAssetState {
    const newState = {...prevState};
    const selectedAssetId = payload;
    const selectedAssetIdsArray = [...prevState.selectedAssetIds];

    if (selectedAssetIdsArray.indexOf(selectedAssetId) === -1) {
        newState.selectedAssetIds = selectedAssetIdsArray.concat([selectedAssetId]);
    } else {
        selectedAssetIdsArray.splice(selectedAssetIdsArray.indexOf(selectedAssetId), 1);
        newState.selectedAssetIds = selectedAssetIdsArray;
    }
    return newState;
}

function updateAssetInStore(prevState: IAssetState, payload: Dictionary<string, any>): IAssetState {
    const assets = {...prevState.assets};
    const updates = payload.asset;
    const assetId = payload.assetId;

    assets[assetId] = {
        ...prevState.assets[assetId],
        ...updates,
    };
    return {
        ...prevState,
        assets: assets,
    };
}
