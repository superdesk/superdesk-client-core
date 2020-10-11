// External modules
import * as React from 'react';

// Types
import {IAssetItem, IAssetCallback} from '../../interfaces';
import {superdeskApi} from '../../apis';

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
import {getDropdownItemsForActions} from '../../utils/assets';

interface IProps {
    asset: Partial<IAssetItem>;
    onClick(asset: Partial<IAssetItem>): void;
    remove?(): void;
    selected?: boolean;
    uploadProgress?: number;
    error?: boolean;
    toggleSelected?(asset: Partial<IAssetItem>): void;
    actions?: Array<IAssetCallback>;
}

export class AssetGridItem extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.onRemove = this.onRemove.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.toggleSelected = this.toggleSelected.bind(this);
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

    toggleSelected() {
        if (this.props.toggleSelected != null) {
            this.props.toggleSelected(this.props.asset);
        }
    }

    stopClickPropagation(e: React.MouseEvent<HTMLDivElement>) {
        e.stopPropagation();
    }

    render() {
        const {gettext, longFormatDateTime} = superdeskApi.localization;
        const typeIcon = getIconTypeFromMimetype(
            this.props.asset.mimetype ?? 'text',
        );
        const actions = getDropdownItemsForActions(this.props.asset, this.props.actions);

        return (
            <GridItem
                onClick={this.onItemClick}
                selected={this.props.selected}
            >
                <GridItemThumb
                    uploading={true}
                    remove={this.props.remove && this.onRemove}
                    icon={typeIcon}
                    selected={this.props.selected}
                    toggleSelected={this.props.toggleSelected && this.toggleSelected}
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
                            {this.props.asset.mimetype}
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
                            {getAssetStateLabel(this.props.asset.state)}
                        </GridItemFooterBlock>
                    )}
                    {actions.length === 0 ? null : (
                        <GridItemFooterBlock singleR={true}>
                            <div className="sd-grid-item__actions" onClick={this.stopClickPropagation}>
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
                        </GridItemFooterBlock>
                    )}
                </GridItemFooter>
            </GridItem>
        );
    }
}
