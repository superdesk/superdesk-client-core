// External Modules
import * as React from 'react';

// Types
import {IAssetItem, IAssetCallback} from '../../interfaces';
import {superdeskApi} from '../../apis';

// UI
import {Checkbox, Icon, Dropdown, IconButton} from 'superdesk-ui-framework/react';
import {
    ListItem,
    ListItemBorder,
    ListItemColumn,
    ListItemRow,
} from '../../ui/list';

// Utils
import {getIconTypeFromMimetype, getAssetStateLabel, getHumanReadableFileSize} from '../../utils/ui';
import {getDropdownItemsForActions, getMimetypeHumanReadable, isAssetLocked} from '../../utils/assets';

interface IProps {
    asset: IAssetItem;
    selected: boolean;
    onClick(asset: IAssetItem): void;
    onDoubleClick?(asset: IAssetItem): void;
    actions?: Array<IAssetCallback>;
    itemSelected: boolean;
    itemSelectedLocked?: boolean;
    updateSelectedAssetIds(asset: Partial<IAssetItem>): void;
}

export class AssetListItem extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);
        this.onItemClick = this.onItemClick.bind(this);
        this.onItemDoubleClick = this.onItemDoubleClick.bind(this);
        this.onPreviewSelect = this.onPreviewSelect.bind(this);
        this.onCheckboxClick = this.onCheckboxClick.bind(this);
    }

    onItemClick(event: React.MouseEvent<HTMLDivElement>) {
        if (this.props.onClick) {
            event.stopPropagation();
            this.props.onClick(this.props.asset);
        }
    }

    onItemDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
        if (this.props.onDoubleClick) {
            event.stopPropagation();
            this.props.onDoubleClick(this.props.asset);
        }
    }

    onPreviewSelect() {
        this.props.onClick(this.props.asset);
    }

    stopClickPropagation(e: React.MouseEvent<HTMLDivElement>) {
        e.stopPropagation();
    }
    onCheckboxClick(e: React.MouseEvent<HTMLDivElement>) {
        this.stopClickPropagation(e);
        this.props.updateSelectedAssetIds(this.props.asset);
    }

    render() {
        const {gettext, longFormatDateTime, getRelativeOrAbsoluteDateTime} = superdeskApi.localization;
        const {config} = superdeskApi.instance;
        const actions = getDropdownItemsForActions(this.props.asset, this.props.actions);
        const mimetype = getMimetypeHumanReadable(this.props.asset.mimetype);
        const versionShort = getRelativeOrAbsoluteDateTime(this.props.asset.versioncreated, config.view.dateformat);
        const versionLong = longFormatDateTime(this.props.asset.versioncreated);

        return (
            <ListItem
                onClick={this.onItemClick}
                onDoubleClick={this.onItemDoubleClick}
                selected={this.props.selected || this.props.itemSelected}
                shadow={1}
            >
                {isAssetLocked(this.props.asset) ? (
                    <ListItemBorder
                        state="locked"
                    />
                ) : null
                }
                <ListItemColumn hasCheck={true} checked={this.props.itemSelected}>
                    <div className="sd-list-item__checkbox-container" onClick={this.onCheckboxClick}>
                        <Checkbox
                            checked={this.props.itemSelected}
                            onChange={() => this.onCheckboxClick}
                        />
                    </div>
                    <span className="sd-list-item__item-type">
                        <Icon name={getIconTypeFromMimetype(this.props.asset.mimetype)} />
                    </span>
                </ListItemColumn>
                <ListItemColumn grow={true}>
                    <ListItemRow>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__slugline">
                                {this.props.asset.name}
                            </span>
                            {this.props.asset.description}
                        </span>
                        <time title={versionLong}>
                            {gettext('Updated {{ datetime }}', {datetime: versionShort})}
                        </time>
                    </ListItemRow>
                    <ListItemRow>
                        {getAssetStateLabel(this.props.asset.state)}
                        <span className="sd-overflow-ellipsis">
                            <span className="sd-list-item__text-label">
                                {gettext('Type:')}
                            </span>
                            <span className="sd-list-item__inline-text">
                                {mimetype}
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
