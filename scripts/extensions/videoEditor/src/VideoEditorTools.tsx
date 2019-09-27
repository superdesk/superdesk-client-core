import * as React from 'react';
import { IVideoEditor } from './VideoEditor';
import { Dropdown } from './Dropdown/Dropdown';
import { CropIcon } from './Dropdown/CropIcon';

interface IProps {
    onToggleVideo: () => void;
    onRotate: () => void;
    onCrop: (aspect: number) => void;
    video: IVideoEditor;
    videoHeadline: string;
}

export class VideoEditorTools extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }

    handleCrop = (aspect: string) => {
        // convert aspect to number
        // 16:9 => 16/9
        const [x, y] = aspect.split(':');
        const aspectValue = parseInt(x) / parseInt(y);
        this.props.onCrop(aspectValue);
    };

    render() {
        return (
            <div className="sd-photo-preview__video-tools">
                <div>
                    <button className="btn btn--ui-dark btn--icon-only btn-hollow" onClick={this.props.onToggleVideo}>
                        <i className={this.props.video.playing ? 'icon-pause' : 'icon-play'}></i>
                    </button>
                    <Dropdown
                        label={<CropIcon disabled={!!this.props.video.degree} />}
                        items={['1:1', '4:3', '16:9']}
                        onSelect={this.handleCrop}
                    />
                    <button
                        className={`
                            btn btn--ui-dark btn--icon-only btn-hollow
                            ${this.props.video.degree ? 'btn--sd-green' : ''}
                            ${this.props.video.cropEnabled ? 'btn--disabled' : ''}
                        `}
                        onClick={this.props.onRotate}
                        disabled={this.props.video.cropEnabled}
                    >
                        <i className="icon-rotate-left"></i>
                    </button>
                </div>
                <span className="sd-photo-preview__label mlr-auto">{this.props.videoHeadline}</span>
            </div>
        );
    }
}
