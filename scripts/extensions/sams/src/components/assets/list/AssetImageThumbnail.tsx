import * as React from 'react';

import {superdeskApi} from '../../../apis';
import {IAssetContentThumbnailProps} from './index';

import {AssetImageRendition} from '../AssetImageRendition';

export class AssetImageThumbnail extends React.PureComponent<IAssetContentThumbnailProps> {
    render() {
        const {config} = superdeskApi.instance;

        return (
            <AssetImageRendition
                asset={this.props.asset}
                file={this.props.file}
                rendition={config.media?.renditions?.sams?.thumbnail ?? {
                    width: 220,
                    height: 140,
                }}
            />
        );
    }
}
