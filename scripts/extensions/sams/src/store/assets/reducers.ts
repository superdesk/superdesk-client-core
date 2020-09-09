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
} from '../../interfaces';
import {
    ASSET_SET_LIST_STYLE,
    IAssetActionTypes,
    IAssetState,
    RECEIVE_ASSETS,
    SET_ASSET_SEARCH_PARAMS,
} from './types';

const initialState: IAssetState = {
    assets: {},
    searchParams: {
        page: 1,
        mimetypes: ASSET_TYPE_FILTER.ALL,
        sort_field: ASSET_SORT_FIELD.NAME,
        sort_order: SORT_ORDER.ASCENDING,
    },
    listItemIds: [],
    searchResultTotal: 0,
    listStyle: ASSET_LIST_STYLE.GRID,
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
    case ASSET_SET_LIST_STYLE:
        return {
            ...state,
            listStyle: action.payload,
        };
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
        sort_field: params.sort_field ?? prevState.searchParams.sort_field ?? ASSET_SORT_FIELD.NAME,
        sort_order: params.sort_order ?? prevState.searchParams.sort_order ?? SORT_ORDER.ASCENDING,
    };

    return newState;
}
