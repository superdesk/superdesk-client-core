// Types
import {IRestApiResponse} from 'superdesk-api';
import {
    IAssetItem,
    IAssetSearchParams,
    ASSET_LIST_STYLE,
    LIST_ACTION,
    ASSET_CONTENT_PANEL_STATE,
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

export const PUSH_ASSET_SEARCH_PARAMS = 'assets_push_search_params';
interface IPushAssetSearchParamsAction {
    type: typeof PUSH_ASSET_SEARCH_PARAMS;
    payload: Partial<IAssetSearchParams>;
}

export const POP_ASSET_SEARCH_PARAMS = 'assets_pop_search_params';
interface IPopAssetSearchParamsAction {
    type: typeof POP_ASSET_SEARCH_PARAMS;
}

export const ASSET_SET_LIST_STYLE = 'assets__set_list_style';
interface IAssetSetListStyleAction {
    type: typeof ASSET_SET_LIST_STYLE;
    payload: ASSET_LIST_STYLE;
}

export const MANAGE_ASSETS_PREVIEW = 'manage_assets__preview';
interface IPreviewAssetAction {
    type: typeof MANAGE_ASSETS_PREVIEW;
    payload: string;
}

export const UPDATE_SELECTED_ASSET_IDS = 'update__selected_asset_ids';
interface IUpdateSelectedAssetIds {
    type: typeof UPDATE_SELECTED_ASSET_IDS;
    payload: string;
}

export const UPDATE_MULTIPLE_SELECTED_ASSET_IDS = 'update__multiple_selected_asset_ids';
interface IUpdateMultipleSelectedAssetIds {
    type: typeof UPDATE_MULTIPLE_SELECTED_ASSET_IDS;
    payload: string;
}

export const MANAGE_MULTIACTIONBAR_CLOSE = 'manage_multi_action_bar__close';
interface ICloseMultiActionBar {
    type: typeof MANAGE_MULTIACTIONBAR_CLOSE;
}

export const MANAGE_ASSETS_CLOSE_CONTENT_PANEL = 'manage_assets__close_content_panel';
interface ICloseAssetContentPanelAction {
    type: typeof MANAGE_ASSETS_CLOSE_CONTENT_PANEL;
}

export const MANAGE_ASSETS_EDIT = 'manage_assets__edit';
interface IEditAssetAction {
    type: typeof MANAGE_ASSETS_EDIT;
    payload?: string;
}

export const MANAGE_ASSET_UPDATE_IN_STORE = 'manage_asset__update_in_store';
interface IUpdateAssetInStore {
    type: typeof MANAGE_ASSET_UPDATE_IN_STORE;
    payload: {
        asset: Partial<IAssetItem>;
        assetId: string
    };
}

export type IAssetActionTypes = IReceiveAssetsAction |
    ISetAssetSearchParamsAction |
    IPushAssetSearchParamsAction |
    IPopAssetSearchParamsAction |
    IAssetSetListStyleAction |
    ICloseAssetContentPanelAction |
    IPreviewAssetAction |
    IUpdateSelectedAssetIds |
    ICloseMultiActionBar |
    IEditAssetAction |
    IUpdateAssetInStore |
    IUpdateMultipleSelectedAssetIds;

export interface IAssetState {
    assets: Dictionary<string, IAssetItem>;
    searchParams: IAssetSearchParams;
    prevSearchParams?: IAssetSearchParams;
    selectedAssetId?: string;
    selectedAssetIds: Array<string>;
    listItemIds: Array<string>;
    searchResultTotal: number;
    listStyle: ASSET_LIST_STYLE;
    contentPanelState: ASSET_CONTENT_PANEL_STATE;
}
