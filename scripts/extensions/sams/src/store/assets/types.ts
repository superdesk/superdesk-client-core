// Types
import {IRestApiResponse} from 'superdesk-api';
import {
    IAssetItem,
    IAssetSearchParams,
    ASSET_LIST_STYLE,
    LIST_ACTION,
} from '../../interfaces';

export const RECEIVE_ASSETS = 'assets__receive';
interface IReceiveAssetsAction {
    type: typeof RECEIVE_ASSETS;
    payload: {
        response: IRestApiResponse<IAssetItem>;
        listAction?: LIST_ACTION;
    };
}

export const SET_ASSET_SEARCH_PARAMS = 'assets__set_search_params';
interface ISetAssetSearchParamsAction {
    type: typeof SET_ASSET_SEARCH_PARAMS;
    payload: Partial<IAssetSearchParams>;
}

export const ASSET_SET_LIST_STYLE = 'assets__set_list_style';
interface IAssetSetListStyleAction {
    type: typeof ASSET_SET_LIST_STYLE;
    payload: ASSET_LIST_STYLE;
}

export type IAssetActionTypes = IReceiveAssetsAction |
    ISetAssetSearchParamsAction |
    IAssetSetListStyleAction;

export interface IAssetState {
    assets: Dictionary<string, IAssetItem>;
    searchParams: IAssetSearchParams;
    listItemIds: Array<string>;
    searchResultTotal: number;
    listStyle: ASSET_LIST_STYLE;
}
