// External Modules
import {createSelector} from 'reselect';

// Types
import {IApplicationState} from '../index';
import {
    IAssetItem,
    IAssetSearchParams,
    ISetItem,
    ASSET_LIST_STYLE,
    ASSET_CONTENT_PANEL_STATE,
} from '../../interfaces';

// Redux Selectors
import {getSetsById} from '../sets/selectors';

export function getAssets(state: IApplicationState): Dictionary<string, IAssetItem> {
    return state.assets.assets;
}

export function getAssetSearchParams(state: IApplicationState): IAssetSearchParams {
    return state.assets.searchParams;
}

export function getAssetListItemIds(state: IApplicationState): Array<string> {
    return state.assets.listItemIds;
}

export function getAssetListStyle(state: IApplicationState): ASSET_LIST_STYLE {
    return state.assets.listStyle;
}

export function getAssetListTotal(state: IApplicationState): number {
    return state.assets.searchResultTotal;
}

export function getSelectedAssetId(state: IApplicationState): string | undefined {
    return state.assets.selectedAssetId;
}

export function getSelectedAssetIds(state: IApplicationState): Array<string> {
    return state.assets.selectedAssetIds;
}

export function getSetContentPanelState(state: IApplicationState): ASSET_CONTENT_PANEL_STATE {
    return state.assets.contentPanelState ?? ASSET_CONTENT_PANEL_STATE.CLOSED;
}

export const getAssetSetFilter = createSelector<
    IApplicationState,
    Dictionary<string, ISetItem>,
    IAssetSearchParams,
    ISetItem | undefined
>(
    [getSetsById, getAssetSearchParams],
    (sets, searchParams) => (
        searchParams.setId != null ?
            sets[searchParams.setId] :
            undefined
    ),
);

export const getAssetSearchResults = createSelector<
    IApplicationState,
    Array<string>,
    Dictionary<string, IAssetItem>,
    Array<IAssetItem>
>(
    [getAssetListItemIds, getAssets],
    (assetIds, assets) => (
        assetIds.map(
            (assetId) => assets[assetId],
        )
    ),
);

export const getSelectedAsset = createSelector<
    IApplicationState,
    Dictionary<string, IAssetItem>,
    string | undefined,
    IAssetItem | undefined
>(
    [getAssets, getSelectedAssetId],
    (assets: Dictionary<string, IAssetItem>, assetId?: string) => (
        assetId != null ?
            assets?.[assetId] :
            undefined
    ),
);

export const getSetNameForSelectedAsset = createSelector<
    IApplicationState,
    Dictionary<string, ISetItem>,
    IAssetItem | undefined,
    string | undefined
>(
    [getSetsById, getSelectedAsset],
    (sets: Dictionary<string, ISetItem>, asset?: IAssetItem) => (
        asset != null ?
            sets?.[asset.set_id].name :
            undefined
    ),
);

export const getSelectedAssetItems = createSelector<
    IApplicationState,
    Array<string>,
    Dictionary<string, IAssetItem>,
    Array<IAssetItem>
>(
    [getSelectedAssetIds, getAssets],
    (assetIds, assets) => (
        assetIds.map(
            (assetId) => assets[assetId],
        )
    ),
);
