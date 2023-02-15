/* eslint-disable react/no-multi-comp */

// External Modules
import * as React from 'react';
import {Dispatch, Store} from 'redux';
import {connect} from 'react-redux';

// Types
import {
    ASSET_ACTIONS,
    ASSET_LIST_STYLE,
    IAssetCallback,
    IAssetItem,
    IAssetSearchParams,
    ISetItem,
    IStorageDestinationItem,
    LIST_ACTION,
    ASSET_CONTENT_PANEL_STATE,
} from '../interfaces';
import {IApplicationState} from '../store';
import {samsApi, superdeskApi} from '../apis';

// Redux Actions & Selectors
import {loadStorageDestinations} from '../store/storageDestinations/actions';
import {loadSets} from '../store/sets/actions';

import {
    loadNextAssetsPage,
    previewAsset,
    queryAssetsFromCurrentSearch,
    setAssetListStyle,
    updateAssetSearchParamsAndListItems,
    updateAssetSearchParamsAndListItemsFromURL,
    updateSelectedAssetIds,
    onEditAsset,
    deleteAssets,
    forceUnlockAsset,
} from '../store/assets/actions';
import {
    getAssetListStyle,
    getAssetListTotal,
    getAssetSearchParams,
    getAssetSearchResults,
    getSelectedAssetId,
    getSelectedAssetIds,
    getSelectedAssetItems,
    getSetContentPanelState,
} from '../store/assets/selectors';
import {toggleFilterPanelState} from '../store/workspace/actions';
import {isFilterPanelOpen} from '../store/workspace/selectors';

// UI
import {PanelContent} from '../ui';
import {SamsApp} from './samsApp';
import {PageLayout} from '../containers/PageLayout';
import {AssetListPanel} from '../components/assets/assetListPanel';
import {AssetFilterPanel} from '../components/assets/assetFilterPanel';
import {WorkspaceSubnav} from '../components/workspaceSubnav';
import {AssetPreviewPanel} from '../components/assets/assetPreviewPanel';
import {AssetEditorPanel} from '../components/assets/assetEditorPanel';

interface IProps {
    assets: Array<IAssetItem>;
    totalAssets: number;
    listStyle: ASSET_LIST_STYLE;
    searchParams: IAssetSearchParams;
    asset?: IAssetItem;
    selectedAssetId: string | undefined;
    selectedAssetIds: Array<string>;
    filterPanelOpen: boolean;
    deleteAsset(asset: IAssetItem): void;
    loadNextPage(): Promise<void>;
    previewAsset(asset: IAssetItem): void;
    onEditAsset(asset: IAssetItem): void;
    updateSelectedAssetIds(asset: IAssetItem): void;
    setListStyle(style: ASSET_LIST_STYLE): void;
    queryAssetsFromCurrentSearch(listStyle: LIST_ACTION): void;
    updateAssetSearchParamsAndListItems(
        params: Partial<IAssetSearchParams>,
        listAction: LIST_ACTION,
    ): void;
    toggleFilterPanel(): void;
    forceUnlockAsset(asset: IAssetItem): void;
    selectedAssets: Array<IAssetItem>;
    contentPanelState: ASSET_CONTENT_PANEL_STATE;
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
    selectedAssets: getSelectedAssetItems(state),
    contentPanelState: getSetContentPanelState(state),
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
    onEditAsset: (asset: IAssetItem) => dispatch<any>(onEditAsset(asset)),
    deleteAsset: (asset: IAssetItem) => dispatch<any>(deleteAssets(asset)),
    forceUnlockAsset: (asset: IAssetItem) => dispatch<any>(forceUnlockAsset(asset)),
});

export function downloadAssetBinary(asset: IAssetItem): void {
    samsApi.assets.getAssetBinary(asset);
}

export class SamsWorkspaceApp extends React.PureComponent {
    onStoreInit(store: Store) {
        // @ts-ignore
        return Promise.all<Array<IStorageDestinationItem>, Array<ISetItem>>([
            store.dispatch<any>(loadStorageDestinations()),
            store.dispatch<any>(loadSets()),
        ])
            .then(([destinations, sets]) => {
                // @ts-ignore
                if (destinations.length && sets.length) {
                    // Only load Assets if we have both StorageDestinations and Sets configured
                    return store.dispatch<any>(
                        updateAssetSearchParamsAndListItemsFromURL(LIST_ACTION.REPLACE),
                    );
                }

                return Promise.resolve();
            })
            .catch(() => {
                // Catch errors here so `Promise.all` still returns on fetching error
                // This can happen when invalid search params are stored in the URL
                return Promise.resolve();
            });
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
        this.onEditAsset = this.onEditAsset.bind(this);
    }

    onDeleteAsset(asset: IAssetItem): void {
        this.props.deleteAsset(asset);
    }

    onEditAsset(asset: IAssetItem) {
        this.props.onEditAsset(asset);
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

    getContentPanelComponent(): React.ComponentType<any> | null {
        if (this.props.contentPanelState === ASSET_CONTENT_PANEL_STATE.PREVIEW) {
            return AssetPreviewPanel;
        } else if (
            this.props.contentPanelState === ASSET_CONTENT_PANEL_STATE.CREATE ||
            this.props.contentPanelState === ASSET_CONTENT_PANEL_STATE.EDIT) {
            return AssetEditorPanel;
        }

        return null;
    }

    render() {
        const ContentPanel = this.getContentPanelComponent();

        const actions: Array<IAssetCallback> =
            [{
                action: ASSET_ACTIONS.EDIT,
                onSelect: this.onEditAsset,
            },
            {
                action: ASSET_ACTIONS.DOWNLOAD,
                onSelect: this.onDownloadSingleAssetCompressedBinary,
            },
            {
                action: ASSET_ACTIONS.PREVIEW,
                onSelect: this.props.previewAsset,
            },
            {
                action: ASSET_ACTIONS.DELETE,
                onSelect: this.onDeleteAsset,
            },
            ];

        if (superdeskApi.privileges.hasPrivilege('sams_manage_assets')) {
            actions.push({
                action: ASSET_ACTIONS.FORCE_UNLOCK,
                onSelect: this.props.forceUnlockAsset,
            });
        }

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
                    rightPanelOpen={ContentPanel != null}
                    rightPanel={ContentPanel == null ? (
                        <div />
                    ) : (
                        <PanelContent>
                            <ContentPanel key={this.props.selectedAssetId} />
                        </PanelContent>
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
                            onItemDoubleClicked={this.onEditAsset}
                            selectedAssetIds={this.props.selectedAssetIds}
                            updateSelectedAssetIds={this.onMultiActionBar}
                            actions={actions}
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
