import * as React from 'react';
import {CropLabel, Dropdown, QualityLabel} from './Dropdown';
import VideoEditorContext from './VideoEditorContext';
import {IVideoEditor} from './interfaces';

interface IProps {
    onToggleVideo: () => void;
    onRotate: () => void;
    onCrop: (aspect: number) => void;
    onQualityChange: (quality: number) => void;
    video: IVideoEditor;
    videoHeadline: string;
    videoResolution: number;
}

export class VideoEditorTools extends React.Component<IProps> {
    static contextType = VideoEditorContext;

    handleCrop = (aspect: string) => {
        // convert aspect to number
        // 16:9 => 16/9
        const [x, y] = aspect.split(':');
        const aspectValue = parseInt(x, 10) / parseInt(y, 10);

        this.props.onCrop(aspectValue);
    }

    handleQuality = (quality: string) => {
        let q = quality.replace('p', '');

        if (q === 'Same') {
            q = '0';
        }
        this.props.onQualityChange(parseInt(q, 10));
    }

    render() {
        const videoResolution = this.props.videoResolution;
        const resolutions = ['Same'].concat([360, 480, 720, 1080].filter(
            (i) => i < videoResolution).map((i) => i + 'p'),
        );
        const qualityDisabled = resolutions.length === 1;

        const {getClass} = this.context.superdesk.utilities.CSS;
        const {gettext} = this.context.superdesk.localization;

        return (
            <div className="sd-photo-preview__video-tools">
                <button
                    className="btn btn--ui-dark btn--hollow btn--icon-only btn--large"
                    onClick={this.props.onToggleVideo}
                >
                    <i className={this.props.video.playing ? 'icon-pause' : 'icon-play'} />
                </button>
                <Dropdown
                    label={<CropLabel />}
                    items={['1:1', '4:3', '16:9']}
                    onSelect={this.handleCrop}
                    resetState={this.props.video.cropEnabled === false}
                    isButton={true}
                    className={getClass('video__dropdown__crop')}
                />
                <button
                    className={`
                        btn btn--ui-dark btn--hollow btn--icon-only btn--large
                            ${this.props.video.degree ? 'btn--sd-green' : ''}
                        `}
                    onClick={this.props.onRotate}
                >
                    <i className="icon-rotate-left" />
                </button>
                <span className="sd-photo-preview__label mlr-auto">{this.props.videoHeadline}</span>
                <div>
                    <span className="sd-text__strong-s">Quality:</span>
                    <Dropdown
                        label={
                            <QualityLabel
                                getText={gettext}
                                title={
                                    qualityDisabled
                                        ? gettext('Maximum quality resize allowed')
                                        : gettext('Video resolution to scale down')
                                }
                            />
                        }
                        items={resolutions}
                        onSelect={this.handleQuality}
                        resetState={this.props.video.quality === 0}
                        className={qualityDisabled && getClass('video__dropdown__quality--disable')}
                    />
                </div>
            </div>
        );
    }
}
