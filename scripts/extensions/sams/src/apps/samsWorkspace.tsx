/* eslint-disable react/no-multi-comp */

// External Modules
import * as React from 'react';
import {Dispatch, Store} from 'redux';
import {connect} from 'react-redux';

// Types
import {ASSET_ACTIONS, ASSET_LIST_STYLE, IAssetItem, IAssetSearchParams, ISetItem, LIST_ACTION} from '../interfaces';
import {samsApi} from '../apis';

// Redux Actions & Selectors
import {loadStorageDestinations} from '../store/storageDestinations/actions';
import {loadSets} from '../store/sets/actions';
import {getActiveSets, getDisabledSets} from '../store/sets/selectors';

import {
    closeAssetPreviewPanel,
    loadNextAssetsPage,
    previewAsset,
    queryAssetsFromCurrentSearch,
    setAssetListStyle,
    updateAssetSearchParamsAndListItems,
    updateAssetSearchParamsAndListItemsFromURL,
    selectAssetMultiActionBar,
    closeMultiActionBar,
} from '../store/assets/actions';
import {
    getAssetListStyle,
    getAssetListTotal,
    getAssetSearchParams,
    getAssetSearchResults,
    getAssetSetFilter,
    getSelectedAsset,
    getSelectedAssetId,
    getSelectedAssetIds,
    getSetNameForSelectedAsset,
} from '../store/assets/selectors';

// UI
import {SamsApp} from './samsApp';
import {PageLayout} from '../containers/PageLayout';
import {AssetListPanel} from '../components/assets/assetListPanel';
import {AssetFilterPanel} from '../components/assets/assetFilterPanel';
import {WorkspaceSubnav} from '../components/workspaceSubnav';
import {AssetPreviewPanel} from '../components/assets/assetPreviewPanel';
import {IApplicationState} from '../store';

interface IProps {
    assets: Array<IAssetItem>;
    totalAssets: number;
    listStyle: ASSET_LIST_STYLE;
    searchParams: IAssetSearchParams;
    activeSets: Array<ISetItem>;
    disabledSets: Array<ISetItem>;
    currentSet?: ISetItem;
    asset?: IAssetItem;
    setName?: string;
    selectedAssetId: string | undefined;
    selectedAssetIds: Array<string> | undefined;
    loadNextPage(): Promise<void>;
    previewAsset(asset: IAssetItem): void;
    onPanelClosed(): void;
    multiActionBar(asset: IAssetItem): void;
    closeMultiActionBar(): void;
    setListStyle(style: ASSET_LIST_STYLE): void;
    queryAssetsFromCurrentSearch(): void;
    updateAssetSearchParamsAndListItems(
        params: Partial<IAssetSearchParams>,
        listAction: LIST_ACTION,
    ): void;
}

interface IState {
    filterPanelOpen: boolean;
    nextPageLoading: boolean;
}

const mapStateToProps = (state: IApplicationState) => ({
    assets: getAssetSearchResults(state),
    totalAssets: getAssetListTotal(state),
    listStyle: getAssetListStyle(state),
    searchParams: getAssetSearchParams(state),
    activeSets: getActiveSets(state),
    disabledSets: getDisabledSets(state),
    currentSet: getAssetSetFilter(state),
    selectedAssetId: getSelectedAssetId(state),
    selectedAssetIds: getSelectedAssetIds(state),
    asset: getSelectedAsset(state),
    setName: getSetNameForSelectedAsset(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    loadNextPage: () => dispatch<any>(loadNextAssetsPage()),
    setListStyle: (style: ASSET_LIST_STYLE) => dispatch(setAssetListStyle(style)),
    queryAssetsFromCurrentSearch: () => dispatch<any>(queryAssetsFromCurrentSearch()),
    updateAssetSearchParamsAndListItems: (params: Partial<IAssetSearchParams>, listAction: LIST_ACTION) =>
        dispatch<any>(
            updateAssetSearchParamsAndListItems(
                params,
                listAction,
            ),
        ),
    previewAsset: (asset: IAssetItem) => dispatch(previewAsset(asset._id)),
    multiActionBar: (asset: IAssetItem) => dispatch(selectAssetMultiActionBar(asset._id)),
    closeMultiActionBar: () => dispatch(closeMultiActionBar()),
    onPanelClosed: () => dispatch(closeAssetPreviewPanel()),
});

export function downloadCompressedBinary(asset_ids: Array<string> | undefined): void {
    samsApi.assets.getCompressedBinary(asset_ids!);
};

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
            filterPanelOpen: false,
            nextPageLoading: false,
        };

        this.toggleFilterPanel = this.toggleFilterPanel.bind(this);
        this.onScroll = this.onScroll.bind(this);
        this.toggleListStyle = this.toggleListStyle.bind(this);
        this.onDownloadAsset = this.onDownloadAsset.bind(this);
        this.onMultiActionBar = this.onMultiActionBar.bind(this);
        this.onCloseMultiActionBar = this.onCloseMultiActionBar.bind(this);
        this.onDownloadMultipleAssetsCompressedBinary = this.onDownloadMultipleAssetsCompressedBinary.bind(this);
    }

    onDownloadMultipleAssetsCompressedBinary(): void {
        downloadCompressedBinary(this.props.selectedAssetIds)
    }

    toggleFilterPanel() {
        this.setState(
            (state) => ({filterPanelOpen: !state.filterPanelOpen}),
        );
    }

    onDownloadAsset(asset: IAssetItem): void {
        downloadCompressedBinary([asset._id])
    }

    onMultiActionBar(asset: IAssetItem) {
        this.props.multiActionBar(asset);
    }

    onCloseMultiActionBar() {
        this.props.closeMultiActionBar();
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
        this.props.queryAssetsFromCurrentSearch();
    }

    render() {
        return (
            <div className="sd-page">
                <PageLayout
                    header={(
                        <WorkspaceSubnav
                            filterPanelOpen={this.state.filterPanelOpen}
                            totalAssets={this.props.totalAssets}
                            listStyle={this.props.listStyle}
                            searchParams={this.props.searchParams}
                            activeSets={this.props.activeSets}
                            disabledSets={this.props.disabledSets}
                            currentSet={this.props.currentSet}
                            downloadMultipleAssets={this.onDownloadMultipleAssetsCompressedBinary}
                            toggleFilterPanel={this.toggleFilterPanel}
                            toggleListStyle={this.toggleListStyle}
                            updateAssetSearchParamsAndListItems={this.props.updateAssetSearchParamsAndListItems}
                            selectedAssetIds={this.props.selectedAssetIds}
                            closeMultiActionBar={this.onCloseMultiActionBar}
                        />
                    )}
                    leftPanelOpen={this.state.filterPanelOpen}
                    leftPanel={(
                        this.state.filterPanelOpen === false ? (
                            <div />
                        ) : (
                            <AssetFilterPanel
                                searchParams={this.props.searchParams}
                                closeFilterPanel={this.toggleFilterPanel}
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
                            downloadAsset={this.onDownloadAsset}
                        />
                    )}
                    mainClassName="sd-padding--2"
                    mainProps={{onScroll: this.onScroll}}
                    main={(
                        <AssetListPanel
                            assets={this.props.assets}
                            listStyle={this.props.listStyle}
                            selectedAssetId={this.props.selectedAssetId}
                            onItemClicked={this.props.previewAsset}
                            selectedAssetIds={this.props.selectedAssetIds}
                            addAssetToSelectedList={this.onMultiActionBar}
                            actions={[{
                                action: ASSET_ACTIONS.PREVIEW,
                                onSelect: this.props.previewAsset,
                            },
                            {
                                action: ASSET_ACTIONS.DOWNLOAD,
                                onSelect: this.onDownloadAsset,
                            }]}
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
