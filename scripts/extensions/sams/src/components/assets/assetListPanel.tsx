// External Modules
import * as React from 'react';
import {Dispatch} from 'redux';
import {connect} from 'react-redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IAssetItem, ASSET_LIST_STYLE} from '../../interfaces';
import {IApplicationState} from '../../store';

// Redux Actions & Selectors
import {previewAsset, onAssetPreviewPanelClosed} from '../../store/assets/actions';
import {getSelectedAssetId, getSelectedAsset, getSetNameForSelectedAsset} from '../../store/assets/selectors';

// UI
import {PanelInfo, ListItemGroup} from '../../ui';
import {GridList} from '../../ui/grid/GridList';
import {getAssetGridItemComponent} from './assetGridItem';
import {getAssetListItemComponent} from './assetListItem';
import {getShowAssetPreviewPanelComponent} from './assetPreviewPanel';
import {PageLayout} from '../../containers/PageLayout';

interface IProps {
    assets: Array<IAssetItem>;
    listStyle: ASSET_LIST_STYLE;
    previewAsset(asset: IAssetItem): void;
    selectedAssetId: string | undefined;
    onPanelClosed(): void;
    asset?: IAssetItem;
    setName?: string;
}

export function getAssetListPanel(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {assertNever} = superdesk.helpers;

    const AssetGridItem = getAssetGridItemComponent(superdesk);
    const AssetListItem = getAssetListItemComponent(superdesk);
    const ShowAssetPreview = getShowAssetPreviewPanelComponent(superdesk);

    const mapStateToProps = (state: IApplicationState) => ({
        selectedAssetId: getSelectedAssetId(state),
        asset: getSelectedAsset(state),
        setName: getSetNameForSelectedAsset(state),
    });

    const mapDispatchToProps = (dispatch: Dispatch) => ({
        previewAsset: (asset: IAssetItem) => dispatch(previewAsset(asset._id)),
        onPanelClosed: () => dispatch(onAssetPreviewPanelClosed()),
    });

    class AssetListPanelComponent extends React.PureComponent<IProps> {
        constructor(props: IProps) {
            super(props);
            this.onItemClick = this.onItemClick.bind(this);
        }

        onItemClick(asset: IAssetItem) {
            this.props.previewAsset(asset);
        }

        render() {
            if (this.props.assets.length === 0) {
                return (
                    <PanelInfo
                        icon="big-icon--comments"
                        heading={gettext('No Assets found')}
                        description={gettext('Upload new Assets or change your search filters')}
                    />
                );
            } else if (this.props.listStyle === ASSET_LIST_STYLE.GRID) {
                return (
                    <PageLayout
                        mainClassName="sd-padding--2"
                        main={
                            <GridList className="sd-margin--1">
                                {this.props.assets.map((asset) => (
                                    <AssetGridItem
                                        key={asset._id}
                                        asset={asset}
                                        onClick={this.onItemClick}
                                        selected={asset._id === this.props.selectedAssetId}
                                    />
                                ))}
                            </GridList>
                        }
                        rightPanelOpen={this.props.selectedAssetId !== undefined}
                        rightPanel={
                            <ShowAssetPreview
                                asset={this.props.asset}
                                setName={this.props.setName}
                                onPanelClosed={this.props.onPanelClosed}
                            />
                        }
                    />
                );
            } else if (this.props.listStyle === ASSET_LIST_STYLE.LIST) {
                return (
                    <PageLayout
                        mainClassName="sd-padding--2"
                        main={
                            <ListItemGroup>
                                {this.props.assets.map((asset) => (
                                    <AssetListItem
                                        key={asset._id}
                                        asset={asset}
                                        onClick={this.onItemClick}
                                        selected={asset._id === this.props.selectedAssetId}
                                    />
                                ))}
                            </ListItemGroup>
                        }
                        rightPanelOpen={this.props.selectedAssetId !== undefined}
                        rightPanel={
                            <ShowAssetPreview
                                asset={this.props.asset}
                                setName={this.props.setName}
                                onPanelClosed={this.props.onPanelClosed}
                            />
                        }
                    />
                );
            }

            assertNever(this.props.listStyle);
            return null;
        }
    }

    return connect(mapStateToProps,
        mapDispatchToProps,
    )(AssetListPanelComponent);
}
