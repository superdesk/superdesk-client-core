import * as React from 'react';

import {samsApi} from '../../../apis';

import {IAssetContentPreviewProps} from './index';

export class AssetVideoPreview extends React.PureComponent<IAssetContentPreviewProps> {
    render() {
        return (
            <div className="side-panel__content-block--image">
                <video
                    controls
                    preload="metadata"
                    style={{
                        // Copied styles from `side-panel__content-block--image img`
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        height: 'auto',
                        margin: 'auto',
                    }}
                >
                    <source
                        src={samsApi.assets.getDownloadUrl(this.props.asset._id)}
                        type={this.props.asset.mimetype}
                    />
                </video>
            </div>
        );
    }
}
