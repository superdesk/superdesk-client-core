/* eslint-disable react/no-multi-comp */

// External Modules
import * as React from 'react';
import {Dispatch, Store} from 'redux';
import {connect} from 'react-redux';

// Types
import {ASSET_LIST_STYLE, IAssetItem, IAssetSearchParams, LIST_ACTION, ASSET_ACTIONS} from '../interfaces';
import {IApplicationState} from '../store';
import {samsApi} from '../apis';

// Redux Actions & Selectors
import {loadStorageDestinations} from '../store/storageDestinations/actions';
import {loadSets} from '../store/sets/actions';

import {
    closeAssetPreviewPanel,
    loadNextAssetsPage,
    previewAsset,
    queryAssetsFromCurrentSearch,
    setAssetListStyle,
    updateAssetSearchParamsAndListItems,
    updateAssetSearchParamsAndListItemsFromURL,
    updateSelectedAssetIds,
} from '../store/assets/actions';
import {
    getAssetListStyle,
    getAssetListTotal,
    getAssetSearchParams,
    getAssetSearchResults,
    getSelectedAsset,
    getSelectedAssetId,
    getSelectedAssetIds,
    getSetNameForSelectedAsset,
    getSelectedAssetItems,
} from '../store/assets/selectors';
import {toggleFilterPanelState} from '../store/workspace/actions';
import {isFilterPanelOpen} from '../store/workspace/selectors';

// UI
import {SamsApp} from './samsApp';
import {PageLayout} from '../containers/PageLayout';
import {AssetListPanel} from '../components/assets/assetListPanel';
import {AssetFilterPanel} from '../components/assets/assetFilterPanel';
import {WorkspaceSubnav} from '../components/workspaceSubnav';
import {AssetPreviewPanel} from '../components/assets/assetPreviewPanel';

interface IProps {
    assets: Array<IAssetItem>;
    totalAssets: number;
    listStyle: ASSET_LIST_STYLE;
    searchParams: IAssetSearchParams;
    asset?: IAssetItem;
    setName?: string;
    selectedAssetId: string | undefined;
    selectedAssetIds: Array<string>;
    filterPanelOpen: boolean;
    loadNextPage(): Promise<void>;
    previewAsset(asset: IAssetItem): void;
    onPanelClosed(): void;
    updateSelectedAssetIds(asset: IAssetItem): void;
    setListStyle(style: ASSET_LIST_STYLE): void;
    queryAssetsFromCurrentSearch(listStyle: LIST_ACTION): void;
    updateAssetSearchParamsAndListItems(
        params: Partial<IAssetSearchParams>,
        listAction: LIST_ACTION,
    ): void;
    toggleFilterPanel(): void;
    selectedAssets: Array<IAssetItem>;
}

interface IState {
    nextPageLoading: boolean;
}

const mapStateToProps = (state: IApplicationState) => ({
    assets: getAssetSearchResults(state),
    totalAssets: getAssetListTotal(state),
    listStyle: getAssetListStyle(state),
    searchParams: getAssetSearchParams(state),
    filterPanelOpen: isFilterPanelOpen(state),
    selectedAssetId: getSelectedAssetId(state),
    selectedAssetIds: getSelectedAssetIds(state),
    asset: getSelectedAsset(state),
    setName: getSetNameForSelectedAsset(state),
    selectedAssets: getSelectedAssetItems(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    loadNextPage: () => dispatch<any>(loadNextAssetsPage()),
    setListStyle: (style: ASSET_LIST_STYLE) => dispatch(setAssetListStyle(style)),
    queryAssetsFromCurrentSearch: (listAction?: LIST_ACTION) => dispatch<any>(queryAssetsFromCurrentSearch(listAction)),
    updateAssetSearchParamsAndListItems: (params: Partial<IAssetSearchParams>, listAction: LIST_ACTION) =>
        dispatch<any>(
            updateAssetSearchParamsAndListItems(
                params,
                listAction,
            ),
        ),
    toggleFilterPanel: () => dispatch<any>(toggleFilterPanelState()),
    previewAsset: (asset: IAssetItem) => dispatch(previewAsset(asset._id)),
    updateSelectedAssetIds: (asset: IAssetItem) => dispatch(updateSelectedAssetIds(asset._id)),
    onPanelClosed: () => dispatch(closeAssetPreviewPanel()),
});

export function downloadAssetBinary(asset: IAssetItem): void {
    samsApi.assets.getAssetBinary(asset);
}

export function deleteAsset(asset: IAssetItem): Promise<void> {
    return samsApi.assets.deleteAsset(asset);
}

export class SamsWorkspaceApp extends React.PureComponent {
    onStoreInit(store: Store) {
        return Promise.all([
            store.dispatch<any>(loadStorageDestinations()),
            store.dispatch<any>(loadSets()),
            store.dispatch<any>(updateAssetSearchParamsAndListItemsFromURL(LIST_ACTION.REPLACE))
                .catch(() => {
                    // Catch errors here so `Promise.all` still returns on fetching error
                    // This can happen when invalid search params are stored in the URL
                    return Promise.resolve();
                }),
        ]);
    }

    render() {
        return (
            <SamsApp onStoreInit={this.onStoreInit}>
                <SamsWorkspace />
            </SamsApp>
        );
    }
}

export class SamsWorkspaceComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            nextPageLoading: false,
        };

        this.onScroll = this.onScroll.bind(this);
        this.toggleListStyle = this.toggleListStyle.bind(this);
        this.onDownloadSingleAssetCompressedBinary = this.onDownloadSingleAssetCompressedBinary.bind(this);
        this.onMultiActionBar = this.onMultiActionBar.bind(this);
        this.onDeleteAsset = this.onDeleteAsset.bind(this);
    }

    onDeleteAsset(asset: IAssetItem): void {
        deleteAsset(asset)
            .then(() => {
                this.props.queryAssetsFromCurrentSearch(LIST_ACTION.REPLACE);
            });
    }

    onDownloadSingleAssetCompressedBinary(asset: IAssetItem): void {
        downloadAssetBinary(asset);
    }

    onMultiActionBar(asset: IAssetItem) {
        this.props.updateSelectedAssetIds(asset);
    }

    onScroll(event: React.UIEvent<HTMLDivElement>) {
        const node = event.currentTarget;

        if (node != null &&
            this.state.nextPageLoading === false &&
            this.props.totalAssets > this.props.assets.length &&
            node.scrollTop + node.offsetHeight + 200 >= node.scrollHeight
        ) {
            this.setState({nextPageLoading: true});
            this.props.loadNextPage().finally(() => {
                this.setState({nextPageLoading: false});
            });
        }
    }

    toggleListStyle() {
        this.props.setListStyle(
            this.props.listStyle === ASSET_LIST_STYLE.GRID ?
                ASSET_LIST_STYLE.LIST :
                ASSET_LIST_STYLE.GRID,
        );
        this.props.queryAssetsFromCurrentSearch(LIST_ACTION.REPLACE);
    }

    render() {
        return (
            <div className="sd-page">
                <PageLayout
                    header={(
                        <WorkspaceSubnav />
                    )}
                    leftPanelOpen={this.props.filterPanelOpen}
                    leftPanel={(
                        this.props.filterPanelOpen === false ? (
                            <div />
                        ) : (
                            <AssetFilterPanel
                                searchParams={this.props.searchParams}
                                closeFilterPanel={this.props.toggleFilterPanel}
                                updateAssetSearchParamsAndListItems={this.props.updateAssetSearchParamsAndListItems}
                            />
                        )
                    )}
                    rightPanelOpen={this.props.selectedAssetId !== undefined}
                    rightPanel={(
                        <AssetPreviewPanel
                            asset={this.props.asset}
                            setName={this.props.setName}
                            onPanelClosed={this.props.onPanelClosed}
                            downloadAsset={this.onDownloadSingleAssetCompressedBinary}
                            deletAsset={this.onDeleteAsset}
                        />
                    )}
                    mainClassName="sd-padding--2"
                    mainProps={{onScroll: this.onScroll}}
                    main={(
                        <AssetListPanel
                            assets={this.props.assets}
                            listStyle={this.props.listStyle}
                            selectedItems={this.props.selectedAssetId == null ?
                                [] :
                                [this.props.selectedAssetId]
                            }
                            onItemClicked={this.props.previewAsset}
                            selectedAssetIds={this.props.selectedAssetIds}
                            updateSelectedAssetIds={this.onMultiActionBar}
                            actions={[{
                                action: ASSET_ACTIONS.PREVIEW,
                                onSelect: this.props.previewAsset,
                            },
                            {
                                action: ASSET_ACTIONS.DOWNLOAD,
                                onSelect: this.onDownloadSingleAssetCompressedBinary,
                            },
                            {
                                action: ASSET_ACTIONS.DELETE,
                                onSelect: this.onDeleteAsset,
                            },
                            ]}
                        />
                    )}
                />
            </div>
        );
    }
}

export const SamsWorkspace = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SamsWorkspaceComponent);
