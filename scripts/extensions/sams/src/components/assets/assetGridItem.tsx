// External modules
import * as React from 'react';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IAssetItem} from '../../interfaces';

// UI
import {GridItem} from '../../ui/grid/GridItem';
import {GridItemThumb} from '../../ui/grid/GritItemThumb';
import {GridItemContent} from '../../ui/grid/GridItemContent';
import {GridItemProgressCircle} from '../../ui/grid/GridItemProgressCircle';
import {getHumanReadableFileSize, getIconTypeFromMimetype} from '../../utils/ui';

interface IProps {
    asset: Partial<IAssetItem>;
    onClick?(): void;
    remove?(): void;
    selected?: boolean;
    uploadProgress?: number;
    error?: boolean;
}

export function getAssetGridItemComponent(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

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
            return (
                <GridItem
                    onClick={this.props.onClick}
                    selected={this.props.selected}
                >
                    <GridItemThumb
                        uploading={true}
                        remove={this.props.remove && this.onRemove}
                        icon={getIconTypeFromMimetype(this.props.asset?.mimetype ?? 'text')}
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
                </GridItem>
            );
        }
    };
}
