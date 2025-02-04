import * as React from 'react';

import {samsApi} from '../../../apis';

import {IAssetContentPreviewProps} from './index';

export class AssetAudioPreview extends React.PureComponent<IAssetContentPreviewProps> {
    render() {
        return (
            <audio controls={true}>
                <source
                    src={samsApi.assets.getDownloadUrl(this.props.asset._id)}
                    type={this.props.asset.mimetype}
                />
            </audio>
        );
    }
}
