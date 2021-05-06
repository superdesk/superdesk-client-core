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
                            toggleSelected={this.props.onItemClicked}
                            onClick={this.props.onItemClicked}
                            onDoubleClick={this.props.onItemDoubleClicked}
                            actions={this.props.actions}
                            itemSelected={this.props.selectedAssetIds?.indexOf(asset._id) !== -1}
                            updateSelectedAssetIds={this.props.updateSelectedAssetIds}
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
                            onClick={this.props.onItemClicked}
                            onDoubleClick={this.props.onItemDoubleClicked}
                            actions={this.props.actions}
                            itemSelected={this.props.selectedAssetIds?.indexOf(asset._id) !== -1}
                            updateSelectedAssetIds={this.props.updateSelectedAssetIds}
                        />
                    ))}
                </ListItemGroup>
            );
        }

        assertNever(this.props.listStyle);
        return null;
    }
}
