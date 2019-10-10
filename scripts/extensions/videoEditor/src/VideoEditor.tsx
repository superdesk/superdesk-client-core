import * as React from 'react';
import { ISuperdesk } from 'superdesk-api';
import { get, isEmpty } from 'lodash';
import ReactCrop from 'react-image-crop';
import { VideoEditorTools } from './VideoEditorTools';
import 'react-image-crop/dist/ReactCrop.css';
import { VideoTimeline } from './VideoTimeline/VideoTimeline';
import { VideoEditorProvider } from './VideoEditorContext';
import { VideoPreviewThumbnail } from './VideoPreviewThumbnail/VideoPreviewThumbnail';
import { IArticleVideo, IVideoEditor, IThumbnail } from './interfaces';

interface IProps {
    article: IArticleVideo;
    superdesk: ISuperdesk;
    onClose: () => void;
}

interface IState extends IVideoEditor {
    cropImg: string;
    trim: {
        start: number;
        end: number;
    };
    thumbnails: Array<IThumbnail>;
}

export class VideoEditor extends React.Component<IProps, IState> {
    ref: React.RefObject<HTMLVideoElement>;
    intervalThumbnails: any;

    constructor(props: IProps) {
        super(props);
        this.ref = React.createRef();
        this.state = {
            crop: { aspect: 16 / 9 },
            cropEnabled: false,
            cropImg: '',
            degree: 0,
            playing: false,
            trim: {
                start: 0,
                end: 0,
            },
            quality: 0,
            thumbnails: [],
        };
    }

    componentDidMount() {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        ctx!.globalAlpha = 0;
        ctx!.fillStyle = 'rgba(0, 0, 200, 0.5)';
        this.setState({
            cropImg: canvas.toDataURL(),
        });
        this.loadTimelineThumbnails();
    }

    componentWillUnmount() {
        clearInterval(this.intervalThumbnails);
    }

    handleTrim = (start: number, end: number) => {
        this.setState({
            trim: {
                start: start,
                end: end,
            },
        });
    };

    handleRotate = () => {
        this.setState(
            prevState => ({ degree: prevState.degree - 90 }),
            () => {
                if (this.state.degree % 360 === 0) {
                    this.setState({ degree: 0 });
                }
            }
        );
    };

    handleToggleVideo = () => {
        if (this.state.playing) {
            this.ref.current!.pause();
        } else {
            this.ref.current!.play();
        }
    };

    handleCrop = (aspect: number) => {
        // when select crop, user must chose aspect, pass empty to turn off crop mode
        this.setState({ cropEnabled: !this.state.cropEnabled }, () => {
            if (aspect) {
                this.setState({ crop: { ...this.state.crop, aspect: aspect } });
            }
        });
    };

    handleQualityChange = (quality: number) => {
        this.setState({ quality: quality });
    };

    loadTimelineThumbnails = () => {
        this.intervalThumbnails = setInterval(() => {
            this.props.superdesk.dataApi
                .findOne('video_edit', this.props.article._id)
                .then((result: any) => {
                    if (!isEmpty(result.project.thumbnails)) {
                        clearInterval(this.intervalThumbnails);
                        this.setState({ thumbnails: result.project.thumbnails.timeline });
                    }
                })
                .catch(() => {
                    clearInterval(this.intervalThumbnails);
                });
        }, 3000);
    };

    render() {
        const { gettext } = this.props.superdesk.localization;
        const videoSrc = get(this.props.article.renditions, 'original.href');
        const degree = this.state.degree + 'deg';
        const { width, height } = (this.ref.current && this.ref.current.getBoundingClientRect()) || {
            width: 0,
            height: 0,
        };

        return (
            <div className="modal modal--fullscreen modal--dark-ui in" style={{ zIndex: 1050, display: 'block' }}>
                <div className="modal__dialog">
                    <div className="modal__content">
                        <div className="modal__header modal__header--flex">
                            <h3 className="modal__heading">{gettext('Modal Fullscreen')}</h3>
                            <button className="icn-btn" onClick={this.props.onClose}>
                                <i className="icon-close-small" />
                            </button>
                        </div>
                        <div className="modal__body modal__body--no-padding">
                            <VideoEditorProvider value={{ superdesk: this.props.superdesk }}>
                                <div className="sd-photo-preview sd-photo-preview--edit-video">
                                    <div className="sd-photo-preview__video">
                                        <div className="sd-photo-preview__video-inner">
                                            <div className="sd-photo-preview__video-container">
                                                <div style={{ transform: `rotate(${degree})` }}>
                                                    <video
                                                        ref={this.ref}
                                                        src={videoSrc}
                                                        onPlay={() => this.setState({ playing: true })}
                                                        onPause={() => this.setState({ playing: false })}
                                                        onLoadedData={() =>
                                                            this.handleTrim(0, this.ref.current!.duration)
                                                        }
                                                        autoPlay
                                                    ></video>
                                                </div>

                                                {this.state.cropEnabled && (
                                                    <ReactCrop
                                                        src={this.state.cropImg}
                                                        crop={this.state.crop}
                                                        onChange={(newCrop: object) => {
                                                            this.setState({ crop: newCrop });
                                                        }}
                                                        style={{
                                                            maxWidth: width,
                                                            maxHeight: height,
                                                            background: 'unset',
                                                            position: 'absolute',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <VideoEditorTools
                                                onToggleVideo={this.handleToggleVideo}
                                                onRotate={this.handleRotate}
                                                onCrop={this.handleCrop}
                                                onQualityChange={this.handleQualityChange}
                                                video={this.state}
                                                videoHeadline={this.props.article.headline}
                                                videoHeight={get(this.ref.current, 'videoHeight')}
                                            />
                                        </div>
                                    </div>
                                    <div className="sd-photo-preview__thumb-strip sd-photo-preview__thumb-strip--video">
                                        <VideoPreviewThumbnail videoRef={this.ref} />
                                        <VideoTimeline
                                            video={this.ref}
                                            trim={this.state.trim}
                                            onTrim={this.handleTrim}
                                            thumbnails={this.state.thumbnails}
                                        />
                                    </div>
                                </div>
                            </VideoEditorProvider>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
