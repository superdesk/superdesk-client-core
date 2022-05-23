import React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {maxItemsDefault} from './constants';
import {IMediaValueOperational, IMediaConfig} from './interfaces';
import {MediaCarousel} from './media-carousel/media-carousel';

type IProps = IPreviewComponentProps<IMediaValueOperational, IMediaConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if ((this.props.value?.length ?? 0) < 1) {
            return null;
        }

        return (
            <MediaCarousel
                mediaItems={this.props.value}
                readOnly={true}
                showPictureCrops={this.props.config.showPictureCrops}
                showTitleInput={this.props.config.showTitleEditingInput}
                maxItemsAllowed={this.props.config.maxItems ?? maxItemsDefault}
            />
        );
    }
}
