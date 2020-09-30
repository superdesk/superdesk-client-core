// External Modules
import * as React from 'react';

// Types
import {IAssetItem, ASSET_LIST_STYLE} from '../../interfaces';

// UI
import {PanelInfo, ListItemGroup} from '../../ui';
import {GridList} from '../../ui/grid/GridList';
import {AssetGridItem} from './assetGridItem';
import {AssetListItem} from './assetListItem';
import {superdeskApi} from '../../apis';

interface IProps {
    assets: Array<IAssetItem>;
    listStyle: ASSET_LIST_STYLE;
    selectedItems?: Array<string>;
    toggleAssetSelected?(asset: IAssetItem): void;
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
                            toggleSelected={this.props.toggleAssetSelected == null ?
                                undefined :
                                () => this.props.toggleAssetSelected && this.props.toggleAssetSelected(asset)
                            }
                            onClick={this.props.toggleAssetSelected == null ?
                                undefined :
                                () => this.props.toggleAssetSelected && this.props.toggleAssetSelected(asset)
                            }
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
                            onClick={this.props.toggleAssetSelected == null ?
                                undefined :
                                () => this.props.toggleAssetSelected && this.props.toggleAssetSelected(asset)
                            }
                        />
                    ))}
                </ListItemGroup>
            );
        }

        assertNever(this.props.listStyle);
        return null;
    }
}
