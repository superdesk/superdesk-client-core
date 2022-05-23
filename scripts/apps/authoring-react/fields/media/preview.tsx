import React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IMediaValueOperational, IMediaConfig} from './interfaces';
import {MediaCarousel} from './media-carousel/media-carousel';

type IProps = IPreviewComponentProps<IMediaValueOperational, IMediaConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        return (
            <MediaCarousel
                mediaItems={this.props.value}
                readOnly={true}
                showPictureCrops={this.props.config.showPictureCrops}
            />
        );
    }
}
