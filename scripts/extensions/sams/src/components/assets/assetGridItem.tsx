// External modules
import * as React from 'react';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IAssetItem} from '../../interfaces';

// UI
import {Icon, Dropdown, IconButton} from 'superdesk-ui-framework/react';
import {GridItem} from '../../ui/grid/GridItem';
import {GridItemFooter} from '../../ui/grid/GridItemFooter';
import {GridItemFooterBlock} from '../../ui/grid/GridItemFooterBlock';
import {GridItemThumb} from '../../ui/grid/GritItemThumb';
import {GridItemContent} from '../../ui/grid/GridItemContent';
import {GridItemProgressCircle} from '../../ui/grid/GridItemProgressCircle';

// Utils
import {
    getHumanReadableFileSize,
    getIconTypeFromMimetype,
    getAssetStateLabel,
} from '../../utils/ui';

interface IProps {
    asset: Partial<IAssetItem>;
    onClick(asset: Partial<IAssetItem>): void;
    remove?(): void;
    selected?: boolean;
    uploadProgress?: number;
    error?: boolean;
}

export function getAssetGridItemComponent(superdesk: ISuperdesk) {
    const {gettext, longFormatDateTime} = superdesk.localization;

    return class AssetGridItem extends React.PureComponent<IProps> {
        constructor(props: IProps) {
            super(props);

            this.onRemove = this.onRemove.bind(this);
            this.onItemClick = this.onItemClick.bind(this);
            this.onSelectPreview = this.onSelectPreview.bind(this);
        }

        onRemove(event: React.MouseEvent<HTMLAnchorElement>) {
            if (this.props.remove != null) {
                event.stopPropagation();

                this.props.remove();
            }
        }

        onItemClick() {
            this.props.onClick(this.props.asset);
        }

        onSelectPreview() {
            this.props.onClick(this.props.asset);
        }

        render() {
            const typeIcon = getIconTypeFromMimetype(
                this.props.asset?.mimetype ?? 'text',
            );

            return (
                <GridItem
                    onClick={this.onItemClick}
                    selected={this.props.selected}
                >
                    <GridItemThumb
                        uploading={true}
                        remove={this.props.remove && this.onRemove}
                        icon={typeIcon}
                    >
                        {this.props.uploadProgress && (
                            <GridItemProgressCircle
                                value={this.props.uploadProgress ?? 0}
                                error={this.props.error ?? false}
                                counter={false}
                            />
                        )}
                    </GridItemThumb>
                    <GridItemContent>
                        {this.props.asset._updated && (
                            <time>{longFormatDateTime(this.props.asset._updated)}</time>
                        )}
                        <p className="sd-grid-item__title">
                            {this.props.asset.name}
                        </p>
                        <p className="sd-grid-item--element-grow">
                            {this.props.asset.description}
                        </p>
                        <div className="sd-grid-item__content-block">
                            <span className="sd-grid-item__text-label">
                                {gettext('Type:')}
                            </span>
                            <span className="sd-grid-item__text-strong">
                                {this.props.asset?.mimetype}
                            </span>
                        </div>
                        <div className="sd-grid-item__content-block">
                            <span className="sd-grid-item__text-label">
                                {gettext('Size:')}
                            </span>
                            <span className="sd-grid-item__text-strong">
                                {this.props.asset.length && getHumanReadableFileSize(this.props.asset.length)}
                            </span>
                        </div>
                    </GridItemContent>
                    <GridItemFooter>
                        {this.props.asset.state && (
                            <GridItemFooterBlock multiL={true}>
                                <Icon
                                    name={typeIcon}
                                    className="sd-grid-item__type-icn sd-grid-item__footer-block-item"
                                />
                                {getAssetStateLabel(superdesk, this.props.asset.state)}
                            </GridItemFooterBlock>
                        )}
                        <div className="sd-grid-item__footer-block sd-grid-item__footer-block--single-r">
                            <div className="sd-grid-item__actions">
                                <Dropdown
                                    align = "right"
                                    append = {true}
                                    items={[
                                        {
                                            type: 'group', label: 'Actions', items: [
                                                'divider',
                                                {
                                                    label: 'Preview',
                                                    icon: 'pencil',
                                                    onSelect: () => this.onSelectPreview,
                                                },
                                            ],
                                        }]}>
                                    <IconButton
                                        ariaValue="dropdown-more-options"
                                        icon="dots-vertical"
                                        onClick={() => false}
                                    />
                                </Dropdown>
                            </div>
                        </div>
                    </GridItemFooter>
                </GridItem>
            );
        }
    };
}
