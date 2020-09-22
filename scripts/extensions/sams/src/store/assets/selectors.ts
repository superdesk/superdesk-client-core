// External Modules
import {createSelector} from 'reselect';

// Types
import {IApplicationState} from '../index';
import {
    IAssetItem,
    IAssetSearchParams,
    ISetItem,
    ASSET_LIST_STYLE,
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
