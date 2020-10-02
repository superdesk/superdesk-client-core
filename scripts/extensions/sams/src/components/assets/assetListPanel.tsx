// External Modules
import * as React from 'react';

// Types
import {IAssetItem, ASSET_LIST_STYLE} from '../../interfaces';
import {superdeskApi} from '../../apis';

// UI
import {PanelInfo, ListItemGroup} from '../../ui';
import {GridList} from '../../ui/grid/GridList';
import {AssetGridItem} from './assetGridItem';
import {AssetListItem} from './assetListItem';

interface IProps {
    assets: Array<IAssetItem>;
    listStyle: ASSET_LIST_STYLE;
    previewAsset(asset: IAssetItem): void;
    selectedAssetId: string | undefined;
}

export class AssetListPanel extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);
        this.onItemClick = this.onItemClick.bind(this);
    }

    onItemClick(asset: IAssetItem) {
        this.props.previewAsset(asset);
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
                            onClick={this.onItemClick}
                            selected={asset._id === this.props.selectedAssetId}
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
                            onClick={this.onItemClick}
                            selected={asset._id === this.props.selectedAssetId}
                        />
                    ))}
                </ListItemGroup>
            );
        }

        assertNever(this.props.listStyle);
        return null;
    }
}
