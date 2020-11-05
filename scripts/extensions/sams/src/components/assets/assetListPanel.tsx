// External Modules
import * as React from 'react';

// Types
import {IAssetItem, ASSET_LIST_STYLE, IAssetCallback} from '../../interfaces';
import {superdeskApi} from '../../apis';

// UI
import {PanelInfo, ListItemGroup} from '../../ui';
import {GridList} from '../../ui/grid/GridList';
import {AssetGridItem} from './assetGridItem';
import {AssetListItem} from './assetListItem';

interface IProps {
    assets: Array<IAssetItem>;
    listStyle: ASSET_LIST_STYLE;
    selectedItems?: Array<string>;
    actions?: Array<IAssetCallback>;
    selectedAssetIds: Array<string> | undefined;
    onItemClicked(asset: IAssetItem): void;
    onItemDoubleClicked?(asset: IAssetItem): void;
    updateSelectedAssetIds(asset: IAssetItem): void;
}

export class AssetListPanel extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);
        this.onItemClick = this.onItemClick.bind(this);
        this.onItemDoubleClick = this.onItemDoubleClick.bind(this);
        this.onUpdateSelectedAssetIds = this.onUpdateSelectedAssetIds.bind(this);
    }

    onItemClick(asset: IAssetItem) {
        this.props.onItemClicked(asset);
    }

    onItemDoubleClick(asset: IAssetItem) {
        if (this.props.onItemDoubleClicked != null) {
            this.props.onItemDoubleClicked(asset);
        }
    }

    onUpdateSelectedAssetIds(asset: IAssetItem) {
        this.props.updateSelectedAssetIds(asset);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {assertNever} = superdeskApi.helpers;

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
                <GridList className="sd-margin--1">
                    {this.props.assets.map((asset) => (
                        <AssetGridItem
                            key={asset._id}
                            asset={asset}
                            selected={this.props.selectedItems?.includes(asset._id) ?? false}
                            toggleSelected={this.props.onItemClicked == null ?
                                undefined :
                                this.onItemClick
                            }
                            onClick={this.onItemClick}
                            onDoubleClick={this.onItemDoubleClick}
                            actions={this.props.actions}
                            itemSelected={this.props.selectedAssetIds?.indexOf(asset._id) !== -1}
                            updateSelectedAssetIds={this.onUpdateSelectedAssetIds}
                        />
                    ))}
                </GridList>
            );
        } else if (this.props.listStyle === ASSET_LIST_STYLE.LIST) {
            return (
                <ListItemGroup>
                    {this.props.assets.map((asset) => (
                        <AssetListItem
                            key={asset._id}
                            asset={asset}
                            selected={this.props.selectedItems?.includes(asset._id) ?? false}
                            onClick={this.onItemClick}
                            onDoubleClick={this.onItemDoubleClick}
                            actions={this.props.actions}
                            itemSelected={this.props.selectedAssetIds?.indexOf(asset._id) !== -1}
                            updateSelectedAssetIds={this.onUpdateSelectedAssetIds}
                        />
                    ))}
                </ListItemGroup>
            );
        }

        assertNever(this.props.listStyle);
        return null;
    }
}
