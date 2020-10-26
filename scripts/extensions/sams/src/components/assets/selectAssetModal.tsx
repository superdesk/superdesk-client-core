// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

// Types
import {ASSET_LIST_STYLE, IAssetItem, IAssetSearchParams, LIST_ACTION} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {
    getAssetListStyle,
    getAssetListTotal,
    getAssetSearchParams,
    getAssetSearchResults,
    getAssetSetFilter,
    getSelectedAssetIds,
} from '../../store/assets/selectors';
import {
    loadNextAssetsPage,
    queryAssetsFromCurrentSearch,
    updateAssetSearchParamsAndListItems,
    updateSelectedAssetIds,
} from '../../store/assets/actions';
import {isFilterPanelOpen} from '../../store/workspace/selectors';
import {toggleFilterPanelState} from '../../store/workspace/actions';

// UI
import {Button, ButtonGroup} from 'superdesk-ui-framework/react';
import {Modal, ModalBody, ModalHeader} from '../../ui/modal';
import {PageLayout} from '../../containers/PageLayout';
import {WorkspaceSubnav} from '../workspaceSubnav';
import {AssetFilterPanel} from './assetFilterPanel';
import {AssetListPanel} from './assetListPanel';

// Utils
import {showModalConnectedToStore} from '../../utils/ui';

interface IProps {
    closeModal(): void;
    totalAssets: number;
    assets: Array<IAssetItem>;
    loadNextPage(): Promise<void>;
    toggleFilterPanel(): void;
    filterPanelOpen: boolean;
    listStyle: ASSET_LIST_STYLE;
    searchParams: IAssetSearchParams;
    selectedAssetIds: Array<string>;
    updateAssetSearchParamsAndListItems(
        params: Partial<IAssetSearchParams>,
        listAction: LIST_ACTION,
    ): void;
    queryAssetsFromCurrentSearch(listAction?: LIST_ACTION): void;
    onAssetsSelected(assets: Dictionary<string, IAssetItem>): void;
    updateSelectedAssetIds(asset: IAssetItem): void;
}

interface IState {
    nextPageLoading: boolean;
    selectedItems: Dictionary<string, IAssetItem>;
}

const mapStateToProps = (state: IApplicationState) => ({
    totalAssets: getAssetListTotal(state),
    assets: getAssetSearchResults(state),
    filterPanelOpen: isFilterPanelOpen(state),
    listStyle: getAssetListStyle(state),
    searchParams: getAssetSearchParams(state),
    currentSet: getAssetSetFilter(state),
    selectedAssetIds: getSelectedAssetIds(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    loadNextPage: () => dispatch<any>(loadNextAssetsPage()),
    updateAssetSearchParamsAndListItems: (params: Partial<IAssetSearchParams>, listAction: LIST_ACTION) => {
        dispatch<any>(
            updateAssetSearchParamsAndListItems(
                params,
                listAction,
            ),
        );
    },
    toggleFilterPanel: () => {
        dispatch<any>(toggleFilterPanelState());
    },
    queryAssetsFromCurrentSearch: (listAction?: LIST_ACTION) => {
        dispatch<any>(queryAssetsFromCurrentSearch(listAction));
    },
    updateSelectedAssetIds: (asset: IAssetItem) => dispatch(updateSelectedAssetIds(asset._id)),

});

export function showSelectAssetModal(): Promise<Dictionary<string, IAssetItem>> {
    return new Promise((resolve) => {
        showModalConnectedToStore<Partial<IProps>>(SelectAssetModal, {
            onAssetsSelected: (assets) => {
                resolve(assets);
            },
        });
    });
}

export class SelectAssetModalComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            nextPageLoading: false,
            selectedItems: {},
        };

        this.onScroll = this.onScroll.bind(this);
        this.toggleItemSelected = this.toggleItemSelected.bind(this);
        this.attachAssets = this.attachAssets.bind(this);
    }

    componentDidMount() {
        this.props.queryAssetsFromCurrentSearch(LIST_ACTION.REPLACE);
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

    toggleItemSelected(asset: IAssetItem) {
        this.setState((prevState: IState) => {
            const selectedItems = {...prevState.selectedItems};

            if (selectedItems[asset._id] == null) {
                selectedItems[asset._id] = asset;
            } else {
                delete selectedItems[asset._id];
            }

            return {selectedItems: selectedItems};
        });
    }

    attachAssets() {
        this.props.onAssetsSelected(this.state.selectedItems);
        this.props.closeModal();
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <Modal
                id="SelectAssetModal"
                size="fullscreen"
                closeModal={this.props.closeModal}
                darkUI={true}
            >
                <ModalHeader
                    text={gettext('Select Asset(s)')}
                    flex={true}
                >
                    <ButtonGroup align="right">
                        <Button
                            text={gettext('Cancel')}
                            onClick={this.props.closeModal}
                            style="hollow"
                        />
                        <Button
                            text={gettext('Attach Asset(s)')}
                            type="primary"
                            onClick={this.attachAssets}
                        />
                    </ButtonGroup>
                </ModalHeader>
                <ModalBody noPadding={true}>
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
                        mainClassName="sd-padding--2"
                        mainProps={{onScroll: this.onScroll}}
                        main={(
                            <AssetListPanel
                                assets={this.props.assets}
                                listStyle={this.props.listStyle}
                                selectedItems={Object.keys(this.state.selectedItems)}
                                onItemClicked={this.toggleItemSelected}
                                selectedAssetIds={this.props.selectedAssetIds}
                                updateSelectedAssetIds={this.onMultiActionBar}
                            />
                        )}
                    />
                </ModalBody>
            </Modal>
        );
    }
}

export const SelectAssetModal = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SelectAssetModalComponent);
