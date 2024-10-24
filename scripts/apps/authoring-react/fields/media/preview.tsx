import React from 'react';
import {IPreviewComponentProps, IMediaValueOperational, IMediaConfig} from 'superdesk-api';
import {maxItemsDefault} from './constants';
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
                canRemoveItems={false}
                showPictureCrops={this.props.config.showPictureCrops}
                showTitleInput={this.props.config.showTitleEditingInput}
                showDescriptionInput={this.props.config.showDescriptionEditingInput}
                maxItemsAllowed={this.props.config.maxItems ?? maxItemsDefault}
                prepareForExternalEditing={(item) => item}
            />
        );
    }
}
