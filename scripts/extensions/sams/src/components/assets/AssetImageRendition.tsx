import * as React from 'react';

import {IAbortablePromise} from 'superdesk-api';
import {IAssetItem} from '../../interfaces';
import {samsApi} from '../../apis';
import {isImageAsset} from '../../utils/assets';

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
    query: IAbortablePromise<Blob> | undefined;

    constructor(props: IProps) {
        super(props);

        if (!isImageAsset(this.props.asset)) {
            throw new Error('Provided Asset is not an image');
        }

        this.state = {source: undefined};
    }

    componentDidMount() {
        this.loadThumbnail();
    }

    componentWillUnmount() {
        if (this.query != null) {
            // Cancel the async request if it's still in progress
            this.query.abort();
        }
        if (this.state.source != null) {
            // Make sure to release the memory created for this image
            window.URL.revokeObjectURL(this.state.source);
        }
    }

    loadThumbnail() {
        if (this.props.asset._id != null) {
            if (this.props.file != null) {
                this.setState({source: window.URL.createObjectURL(this.props.file)});
            } else {
                this.query = samsApi.assets.images.getRendition(
                    this.props.asset._id,
                    this.props.rendition.width,
                    this.props.rendition.height,
                    this.props.rendition.keepProportions ?? true,
                );

                this.query.response.then((file) => {
                    delete this.query;
                    this.setState({source: window.URL.createObjectURL(file)});
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
            />
        );

        return container == null ?
            children :
            container(this.state.source == null, children);
    }
}
