import * as React from 'react';
import { Dropdown } from './Dropdown/Dropdown';
import { CropIcon } from './Dropdown/CropIcon';
import { QualityLabel } from './Dropdown/QualityLabel';
import VideoEditorContext from './VideoEditorContext';
import { IVideoEditor } from './interfaces';

interface IProps {
    onToggleVideo: () => void;
    onRotate: () => void;
    onCrop: (aspect: number) => void;
    onQualityChange: (quality: number) => void;
    video: IVideoEditor;
    videoHeadline: string;
    videoHeight: number | undefined;
}

export class VideoEditorTools extends React.Component<IProps> {
    static contextType = VideoEditorContext;
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

    handleQuality = (quality: string) => {
        let q = quality.replace('p', '');
        if (q === 'Same') {
            q = '0';
        }
        this.props.onQualityChange(parseInt(q));
    };

    render() {
        const videoHeight = this.props.videoHeight || 0;
        const resolutions = ['Same'].concat([360, 480, 720, 1080].filter(i => i < videoHeight).map(i => i + 'p'));
        const { getClass } = this.context.superdesk.utilities.CSS;
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
                        resetState={this.props.video.cropEnabled === false}
                        isButton={true}
                        className={getClass('video__dropdown')}
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
                <Dropdown
                    label={<QualityLabel />}
                    items={resolutions}
                    onSelect={this.handleQuality}
                    resetState={this.props.video.quality === 0}
                />
            </div>
        );
    }
}
