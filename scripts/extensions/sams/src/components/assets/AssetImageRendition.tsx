import * as React from 'react';

import {IAssetItem} from '../../interfaces';
import {samsApi} from '../../apis';
import {isImageAsset} from '../../utils/assets';
import {showImagePreviewModal} from './assetImagePreviewFullScreen';

interface IProps extends React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>{
    asset: Partial<IAssetItem>;
    file?: File;
    rendition: {
        width: number;
        height: number;
        keepProportions?: boolean;
    };
    container?: (loading: boolean, children: React.ReactElement) => React.ReactElement;
}

interface IState {
    source?: string;
}

export class AssetImageRendition extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        if (!isImageAsset(this.props.asset)) {
            throw new Error('Provided Asset is not an image');
        }

        this.state = {source: undefined};

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        this.loadRendition();
    }

    componentWillUnmount() {
        if (this.props.file != null && this.state.source != null) {
            // Make sure to release the memory created for this image
            window.URL.revokeObjectURL(this.state.source);
        }
    }

    handleClick() {
        showImagePreviewModal(this.props.asset);
    }

    loadRendition() {
        if (this.props.asset._id != null) {
            if (this.props.file != null) {
                this.setState({source: window.URL.createObjectURL(this.props.file)});
            } else {
                this.setState({
                    source: samsApi.assets.images.getRenditionUrl(
                        this.props.asset._id,
                        this.props.rendition.width,
                        this.props.rendition.height,
                        this.props.rendition.keepProportions ?? true,
                    ),
                });
            }
        }
    }

    render() {
        const {
            asset,
            file,
            rendition,
            container,
            ...imageProps
        } = this.props;

        const children = this.state.source == null ? (
            <div className="sd-loader" />
        ) : (
            <img
                alt={this.props.asset.name}
                {...imageProps}
                src={this.state.source}
                onClick={this.handleClick}
            />
        );

        return container == null ?
            children :
            container(this.state.source == null, children);
    }
}
