// External Modules
import * as React from 'react';

// Types
import {IAssetItem, IAssetCallback} from '../../interfaces';
import {superdeskApi} from '../../apis';

// UI
import {Icon, Dropdown, IconButton} from 'superdesk-ui-framework/react';
import {
    ListItem,
    ListItemBorder,
    ListItemColumn,
    ListItemRow,
} from '../../ui/list';
import {Checkbox} from '../../ui/grid/Checkbox';

// Utils
import {getIconTypeFromMimetype, getAssetStateLabel, getHumanReadableFileSize} from '../../utils/ui';
import {getDropdownItemsForActions} from '../../utils/assets';

interface IProps {
    asset: IAssetItem;
    onClick(asset: IAssetItem): void;
    selected: boolean;
    actions?: Array<IAssetCallback>;
    itemSelected: boolean;
    selectCheckboxAsset(asset: Partial<IAssetItem>): void;
}

export class AssetListItem extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);
        this.onItemClick = this.onItemClick.bind(this);
        this.onPreviewSelect = this.onPreviewSelect.bind(this);
        this.onCheckboxClickFunctions = this.onCheckboxClickFunctions.bind(this);
    }

    onItemClick(event: React.MouseEvent<HTMLDivElement>) {
        if (this.props.onClick) {
            event.stopPropagation();
            this.props.onClick(this.props.asset);
        }
    }

    onPreviewSelect() {
        this.props.onClick(this.props.asset);
    }

    stopClickPropagation(e: React.MouseEvent<HTMLDivElement>) {
        e.stopPropagation();
    }
    onCheckboxClickFunctions(e: React.MouseEvent<HTMLDivElement>) {
        this.stopClickPropagation(e);
        this.props.selectCheckboxAsset(this.props.asset)
    }

    render() {
        const {gettext, longFormatDateTime} = superdeskApi.localization;
        const actions = getDropdownItemsForActions(this.props.asset, this.props.actions);

        return (
            <ListItem onClick={this.onItemClick} selected={this.props.selected || this.props.itemSelected} shadow={1}>
                <ListItemBorder />
                <ListItemColumn>
                    <Icon name={getIconTypeFromMimetype(this.props.asset.mimetype)} />
                    <div className="sd-grid-item__checkbox" onClick={this.onCheckboxClickFunctions}>
                    <Checkbox checked={this.props.itemSelected}
                                onChange={() => this.onCheckboxClickFunctions} />
                    </div>
                </ListItemColumn>
                <ListItemColumn grow={true}>
                    <ListItemRow>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__slugline">
                                {this.props.asset.name}
                            </span>
                            {this.props.asset.description}
                        </span>
                        <time>{longFormatDateTime(this.props.asset._updated)}</time>
                    </ListItemRow>
                    <ListItemRow>
                        {getAssetStateLabel(this.props.asset.state)}
                        <span className="sd-overflow-ellipsis">
                            <span className="sd-list-item__text-label">
                                {gettext('Type:')}
                            </span>
                            <span className="sd-list-item__inline-text">
                                {this.props.asset.mimetype}
                            </span>
                            <span className="sd-list-item__text-label">
                                {gettext('Size:')}
                            </span>
                            <span className="sd-list-item__inline-text">
                                {getHumanReadableFileSize(this.props.asset.length)}
                            </span>
                        </span>
                    </ListItemRow>
                </ListItemColumn>
                {actions.length === 0 ? null : (
                    <div className="sd-list-item__action-menu" onClick={this.stopClickPropagation}>
                        <Dropdown
                            align = "right"
                            append = {true}
                            items={[{
                                type: 'group',
                                label: gettext('Actions'),
                                items: [
                                    'divider',
                                    ...actions,
                                ],
                            }]}
                        >
                            <IconButton
                                ariaValue="dropdown-more-options"
                                icon="dots-vertical"
                                onClick={() => false}
                            />
                        </Dropdown>
                    </div>
                )}
            </ListItem>
        );
    }
}
