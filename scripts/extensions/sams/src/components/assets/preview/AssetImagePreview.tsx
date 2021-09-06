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
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    height: 'auto',
                    margin: 'auto',
                    pointerEvents: 'none',
                    transition: 'filter ease-in-out 0.3s',
                }}
                container={(loading, children) => (
                    <div
                        className="asset-preview__image"
                        style={!loading ? undefined : {
                            width: '100%',
                            height: '250px',
                            position: 'relative',
                            backgroundColor: '#2c2c2c',
                        }}
                    >
                        {children}
                    </div>
                )}
            />
        );
    }
}
