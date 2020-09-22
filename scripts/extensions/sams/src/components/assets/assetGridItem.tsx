// External modules
import * as React from 'react';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IAssetItem} from '../../interfaces';

// UI
import {Icon} from 'superdesk-ui-framework/react';
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
    onClick?(): void;
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
        }

        onRemove(event: React.MouseEvent<HTMLAnchorElement>) {
            if (this.props.remove != null) {
                event.stopPropagation();

                this.props.remove();
            }
        }

        render() {
            const typeIcon = getIconTypeFromMimetype(
                this.props.asset?.mimetype ?? 'text',
            );

            return (
                <GridItem
                    onClick={this.props.onClick}
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
                    </GridItemFooter>
                </GridItem>
            );
        }
    };
}
