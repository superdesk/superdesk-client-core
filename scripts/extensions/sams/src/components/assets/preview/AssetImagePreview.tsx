import * as React from 'react';

import {superdeskApi} from '../../../apis';
import {IAssetContentPreviewProps} from './index';

import {AssetImageRendition} from '../AssetImageRendition';

export class AssetImagePreview extends React.PureComponent<IAssetContentPreviewProps> {
    render() {
        const {config} = superdeskApi.instance;

        return (
            <AssetImageRendition
                asset={this.props.asset}
                rendition={config.media?.renditions?.sams?.viewImage ?? {
                    width: 640,
                    height: 640,
                }}
                container={(_loading, children) => (
                    <div className="side-panel__content-block--image">
                        {children}
                    </div>
                )}
            />
        );
    }
}
