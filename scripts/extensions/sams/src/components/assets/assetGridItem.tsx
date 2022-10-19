// External modules
import * as React from 'react';

// Types
import {IAssetItem, IAssetCallback} from '../../interfaces';
import {superdeskApi} from '../../apis';

// UI
import {Icon, IconButton, Menu} from 'superdesk-ui-framework/react';
import {GridItem} from '../../ui/grid/GridItem';
import {GridItemFooter} from '../../ui/grid/GridItemFooter';
import {GridItemFooterBlock} from '../../ui/grid/GridItemFooterBlock';
import {GridItemThumb} from '../../ui/grid/GritItemThumb';
import {GridItemContent} from '../../ui/grid/GridItemContent';
import {GridItemProgressCircle} from '../../ui/grid/GridItemProgressCircle';
import {getThumbnailComponent} from './list';

// Utils
import {
    getHumanReadableFileSize,
    getIconTypeFromMimetype,
    getAssetStateLabel,
} from '../../utils/ui';
import {getDropdownItemsForActions, getMimetypeHumanReadable, isAssetLocked} from '../../utils/assets';

interface IProps {
    asset: Partial<IAssetItem>;
    file?: File;
    onClick(asset: Partial<IAssetItem>): void;
    onDoubleClick?(asset: Partial<IAssetItem>): void;
    remove?(): void;
    selected?: boolean;
    uploadProgress?: number;
    error?: boolean;
    toggleSelected?(asset: Partial<IAssetItem>): void;
    actions?: Array<IAssetCallback>;
    itemSelected?: boolean;
    updateSelectedAssetIds?(asset: Partial<IAssetItem>): void;
    updateMultipleSelectedAssetIds?(asset: Partial<IAssetItem>): void;
}

export class AssetGridItem extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.onRemove = this.onRemove.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.onItemDoubleClick = this.onItemDoubleClick.bind(this);
        this.onCheckboxClick = this.onCheckboxClick.bind(this);
        this.toggleSelected = this.toggleSelected.bind(this);
    }

    onRemove(event: React.MouseEvent<HTMLAnchorElement>) {
        if (this.props.remove != null) {
            event.stopPropagation();

            this.props.remove();
        }
    }

    onItemClick(event: React.MouseEvent) {
        const {querySelectorParent} = superdeskApi.utilities;

        // Don't trigger preview if click went to a three dot menu or other button inside the grid item
        if (querySelectorParent(event.target as HTMLElement, 'button', {self: true})) {
            return;
        }

        this.props.onClick(this.props.asset);
    }

    onItemDoubleClick() {
        if (this.props.onDoubleClick != null) {
            this.props.onDoubleClick(this.props.asset);
        }
    }

    toggleSelected() {
        if (this.props.toggleSelected != null) {
            this.props.toggleSelected(this.props.asset);
        }
    }

    stopClickPropagation(e: React.MouseEvent<HTMLDivElement>) {
        e.stopPropagation();
    }

    onCheckboxClick(e: React.MouseEvent<HTMLDivElement>) {
        this.stopClickPropagation(e);
        if (e.shiftKey && this.props.updateMultipleSelectedAssetIds) {
            this.props.updateMultipleSelectedAssetIds(this.props.asset);
        } else if (this.props.updateSelectedAssetIds) {
            this.props.updateSelectedAssetIds(this.props.asset);
        }
    }

    render() {
        const {gettext, longFormatDateTime} = superdeskApi.localization;
        const typeIcon = getIconTypeFromMimetype(
            this.props.asset.mimetype ?? 'text',
        );
        const actions = getDropdownItemsForActions(this.props.asset, this.props.actions);
        const mimetype = getMimetypeHumanReadable(this.props.asset.mimetype);
        const ContentThumbnail = getThumbnailComponent(this.props.asset);

        return (
            <GridItem
                onClick={this.onItemClick}
                onDoubleClick={this.props.onDoubleClick && this.onItemDoubleClick}
                selected={this.props.selected || this.props.itemSelected}
                locked={isAssetLocked(this.props.asset)}
            >
                <GridItemThumb
                    remove={this.props.remove && this.onRemove}
                    icon={ContentThumbnail != null ? undefined : typeIcon}
                    selected={this.props.itemSelected}
                    toggleSelected={this.props.toggleSelected && this.toggleSelected}
                    onCheckboxClick={this.onCheckboxClick}
                >
                    {ContentThumbnail == null ? null : (
                        <ContentThumbnail
                            asset={this.props.asset}
                            file={this.props.file}
                        />
                    )}
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
                        {this.props.asset.name?.substring(0, 25)}
                    </p>
                    <p className="sd-grid-item--element-grow">
                        {this.props.asset.description?.substring(0, 120)}
                    </p>
                    <div className="sd-grid-item__content-block">
                        <span className="sd-grid-item__text-label">
                            {gettext('Type:')}
                        </span>
                        <span className="sd-grid-item__text-strong">
                            {mimetype}
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
                        <Menu items={actions}>
                            {(toggle) => (
                                <GridItemFooterBlock singleR={true}>
                                    <div className="sd-grid-item__actions" onClick={this.stopClickPropagation}>
                                        <IconButton
                                            ariaValue="dropdown-more-options"
                                            icon="dots-vertical"
                                            onClick={toggle}
                                        />
                                    </div>
                                </GridItemFooterBlock>
                            )}
                        </Menu>
                    )}
                </GridItemFooter>
                <div className="sd-grid-item__state-border" />
            </GridItem>
        );
    }
}
