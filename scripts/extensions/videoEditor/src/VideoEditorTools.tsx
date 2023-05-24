import * as React from 'react';
import {Dropdown} from './Dropdown/Dropdown';
import {CropLabel} from './Dropdown/CropLabel';
import {QualityLabel} from './Dropdown/QualityLabel';

interface IProps {
    wrapperRef: (element: HTMLDivElement) => void;
    playPause: () => void;
    onRotate: () => void;
    onCrop: (aspect: number) => void;
    onQualityChange: (quality: number) => void;
    gettext: (text: string) => string;
    getClass: (text: string) => string;
    cropEnabled: boolean;
    videoPlaying: boolean;
    videoDegree: number;
    videoQuality: number;
    videoHeadline: string;
    videoResolution: number;
}

export class VideoEditorTools extends React.PureComponent<IProps> {
    render() {
        const resolutions = [{label: 'Same', value: 0}].concat(
            [480, 720, 1080]
                .filter((i) => i < this.props.videoResolution)
                .map((i) => ({label: i + 'p', value: i})),
        );
        const qualityDisabled = resolutions.length === 1;
        const cropItems = [[1, 1], [4, 3], [16, 9]].map((i) => {
            const [x, y] = i;

            return {label: x + ':' + y, value: x / y};
        });

        const {getClass, gettext} = this.props;

        return (
            <div className="sd-photo-preview__video-tools" ref={this.props.wrapperRef}>
                <button
                    className="btn btn--ui-dark btn--hollow btn--icon-only btn--large"
                    onClick={this.props.playPause}
                >
                    <i className={this.props.videoPlaying ? 'icon-pause' : 'icon-play'} />
                </button>
                <Dropdown
                    label={<CropLabel />}
                    items={cropItems}
                    onSelect={this.props.onCrop}
                    disabled={this.props.cropEnabled === false}
                    isButton={true}
                    className={getClass('dropdown__crop')}
                    gettext={gettext}
                />
                <button
                    className={`
                        btn btn--ui-dark btn--hollow btn--icon-only btn--large
                            ${this.props.videoDegree ? 'btn--sd-green' : ''}
                        `}
                    onClick={this.props.onRotate}
                >
                    <i className="icon-rotate-left" />
                </button>
                <span className={`sd-photo-preview__label mlr-auto ${getClass('info__headline')}`}>
                    {this.props.videoHeadline}
                </span>
                <div>
                    <span className="sd-text__strong-s">{gettext('Quality:')}</span>
                    <Dropdown
                        label={(
                            <QualityLabel
                                gettext={gettext}
                                getClass={getClass}
                                title={
                                    qualityDisabled
                                        ? gettext(
                                            'Changing quality is only supported for 480p and higher quality videos.',
                                        )
                                        : null
                                }
                            />
                        )}
                        items={resolutions}
                        onSelect={this.props.onQualityChange}
                        disabled={this.props.videoQuality === 0}
                        className={qualityDisabled ? getClass('dropdown__quality--disable') : ''}
                        gettext={gettext}
                    />
                </div>
            </div>
        );
    }
}
