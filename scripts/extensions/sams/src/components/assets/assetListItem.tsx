// External Modules
import * as React from 'react';
import {ISuperdesk} from 'superdesk-api';

// Types
import {IAssetItem} from '../../interfaces';

// UI
import {Icon, Dropdown, IconButton} from 'superdesk-ui-framework/react';
import {
    ListItem,
    ListItemBorder,
    ListItemColumn,
    ListItemRow,
} from '../../ui/list';

// Utils
import {getIconTypeFromMimetype, getAssetStateLabel, getHumanReadableFileSize} from '../../utils/ui';

interface IProps {
    asset: IAssetItem;
    onClick(asset: IAssetItem): void;
    selected: boolean;
}

export function getAssetListItemComponent(superdesk: ISuperdesk) {
    const {gettext, longFormatDateTime} = superdesk.localization;

    return class AssetListItem extends React.PureComponent<IProps> {
        constructor(props: IProps) {
            super(props);
            this.onItemClick = this.onItemClick.bind(this);
            this.onPreviewSelect = this.onPreviewSelect.bind(this);
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

        render() {
            return (
                <ListItem onClick={this.onItemClick} selected={this.props.selected} shadow={1}>
                    <ListItemBorder />
                    <ListItemColumn>
                        <Icon name={getIconTypeFromMimetype(this.props.asset.mimetype)} />
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
                            {getAssetStateLabel(superdesk, this.props.asset.state)}
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
                    <div className="sd-list-item__action-menu">
                        <Dropdown
                            align = "right"
                            append = {true}
                            items={[
                                {
                                    type: 'group', label: 'Actions', items: [
                                        'divider',
                                        {
                                            label: 'Preview',
                                            icon: 'eye-open',
                                            onSelect: () => this.onPreviewSelect,
                                        },
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
                </ListItem>
            );
        }
    };
}
