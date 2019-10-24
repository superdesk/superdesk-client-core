import * as React from 'react';
// @ts-ignore
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ISuperdesk } from 'superdesk-api';
import { get, isEmpty, omit, pick, isEqual } from 'lodash';
import { VideoEditorTools } from './VideoEditorTools';
import { VideoTimeline } from './VideoTimeline/VideoTimeline';
import { VideoEditorHeader } from './VideoEditorHeader';
import { VideoEditorProvider } from './VideoEditorContext';
import { VideoPreviewThumbnail } from './VideoPreviewThumbnail/VideoPreviewThumbnail';
import { IArticleVideo, IVideoEditor, IThumbnail } from './interfaces';

interface IProps {
    article: IArticleVideo;
    superdesk: ISuperdesk;
    onClose: () => void;
}

interface IState extends IVideoEditor {
    isDirty: boolean;
    trim: {
        start: number;
        end: number;
    };
    cropImg: string;
    thumbnails: Array<IThumbnail>;
    loading: boolean;
}

export class VideoEditor extends React.Component<IProps, IState> {
    private ref: React.RefObject<HTMLVideoElement>;
    private intervalThumbnails: any;
    private initState: Pick<IState, 'crop' | 'degree' | 'trim' | 'quality'>;

    constructor(props: IProps) {
        super(props);
        this.ref = React.createRef();
        this.initState = {
            crop: { aspect: 16 / 9, unit: 'px', width: 0, height: 0, x: 0, y: 0 },
            degree: 0,
            trim: {
                start: 0,
                end: 0,
            },
            quality: 0,
        };
        this.state = {
            ...this.initState,
            isDirty: false,
            cropEnabled: false,
            cropImg: '',
            playing: false,
            loading: false,
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

    handleTrim = (start: number, end: number, runCheckIsDirty: boolean = false) => {
        this.setState(
            {
                trim: {
                    start: start,
                    end: end,
                },
            },
            () => {
                runCheckIsDirty && this.checkIsDirty();
            }
        );
    };

    handleRotate = () => {
        this.setState(
            prevState => ({ degree: prevState.degree - 90 }),
            () => {
                if (this.state.degree % 360 === 0) {
                    this.setState({ degree: 0 }, this.checkIsDirty);
                } else {
                    this.checkIsDirty();
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

    handleToggleCrop = (aspect: number) => {
        const cropAspect = aspect || this.state.crop.aspect || 0;

        this.setState({ cropEnabled: !this.state.cropEnabled }, () => {
            if (this.state.cropEnabled === false) {
                this.setState({ crop: this.initState.crop }, this.checkIsDirty);
            } else {
                // draw sample crop area, only draw 80% instead of full video width, height so
                // user can resize, move easily
                let { videoWidth, videoHeight } = this.ref.current!;
                videoWidth = (videoWidth * 80) / 100;
                videoHeight = (videoHeight * 80) / 100;

                const ratio = videoWidth / videoHeight;
                if (ratio > 1) {
                    videoWidth = videoHeight * cropAspect;
                } else {
                    videoHeight = videoWidth * cropAspect;
                }
                this.setState(
                    {
                        crop: {
                            ...this.initState.crop,
                            aspect: cropAspect,
                            width: videoWidth,
                            height: videoHeight,
                        },
                    },
                    this.checkIsDirty
                );
            }
        });
    };

    handleToggleLoading = (isToggle: boolean) => {
        if (this.state.playing) {
            this.handleToggleVideo();
        }
        this.setState({ loading: isToggle });
    };

    handleQualityChange = (quality: number) => {
        this.setState({ quality: quality }, this.checkIsDirty);
    };

    handleReset = () => {
        this.setState({
            ...this.initState,
            trim: {
                start: 0,
                end: this.ref.current!.duration,
            },
            isDirty: false,
            cropEnabled: false,
        });
    };

    handleSave = () => {
        const { dataApi } = this.props.superdesk;
        const crop = pick(this.state.crop, ['x', 'y', 'width', 'height']);
        const body = {
            type: 'edit',
            crop: Object.values(crop).join(','),
            rotate: this.state.degree,
            trim: this.state.trim,
            scale: this.state.quality,
        };
        if (body.crop === '0,0,0,0') {
            delete body.crop;
        }
        if (body.rotate === 0) {
            delete body.rotate;
        }
        dataApi
            .create('video_edit', {
                capture: body,
                item: this.props.article,
            })
            .then((res: any) => res.json())
            .then(res => console.log(res));
    };

    checkIsDirty = () => {
        const state = pick(this.state, ['crop', 'trim', 'degree', 'quality']);
        // ignore trim.end as initState don't load video duration due to ref can be null when component did mount
        // confirm bar should not be toggled when user change crop aspect
        if (
            state.trim.end !== this.ref.current!.duration ||
            !isEqual(omit(state, ['trim.end', 'crop.aspect']), omit(this.initState, ['trim.end', 'crop.aspect']))
        ) {
            this.setState({ isDirty: true });
        } else {
            this.setState({ isDirty: false });
        }
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
        const { getClass } = this.props.superdesk.utilities.CSS;
        const videoSrc = get(this.props.article.renditions, 'original.href');
        const degree = this.state.degree + 'deg';
        const { width, height } = (this.ref.current && this.ref.current.getBoundingClientRect()) || {
            width: 0,
            height: 0,
        };

        const { videoWidth, videoHeight } = this.ref.current! || { videoWidth: 1, videoHeight: 1 };
        let scaleRatio = videoWidth / videoHeight || 1;
        if (this.state.degree % 180 === 0) {
            scaleRatio = 1;
        } else if (scaleRatio > 1) {
            scaleRatio = 1 / scaleRatio;
        }

        return (
            <div className="modal modal--fullscreen modal--dark-ui in" style={{ zIndex: 1050, display: 'block' }}>
                <div className="modal__dialog">
                    <div className="modal__content">
                        <div className="modal__header modal__header--flex">
                            <h3 className="modal__heading">{gettext('Edit Video')}</h3>
                            <VideoEditorHeader
                                onClose={this.props.onClose}
                                onReset={this.handleReset}
                                onSave={this.handleSave}
                                isDirty={this.state.isDirty}
                            />
                        </div>
                        <div className="modal__body modal__body--no-padding">
                            {this.state.loading && <div className={getClass('video__loading')}></div>}
                            <VideoEditorProvider value={{ superdesk: this.props.superdesk }}>
                                <div className="sd-photo-preview sd-photo-preview--edit-video">
                                    <div className="sd-photo-preview__video">
                                        <div className="sd-photo-preview__video-inner">
                                            <div className="sd-photo-preview__video-container">
                                                <div style={{ transform: `rotate(${degree}) scale(${scaleRatio})` }}>
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
                                                        onChange={(newCrop: ReactCrop.Crop) => {
                                                            this.setState({ crop: newCrop }, this.checkIsDirty);
                                                        }}
                                                        style={{
                                                            width: width,
                                                            height: height,
                                                            background: 'unset',
                                                            position: 'absolute',
                                                            marginTop: '1.5rem',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <VideoEditorTools
                                                onToggleVideo={this.handleToggleVideo}
                                                onRotate={this.handleRotate}
                                                onCrop={this.handleToggleCrop}
                                                onQualityChange={this.handleQualityChange}
                                                video={this.state}
                                                videoHeadline={this.props.article.headline}
                                                videoHeight={get(this.ref.current, 'videoHeight')}
                                            />
                                        </div>
                                    </div>
                                    <div className="sd-photo-preview__thumb-strip sd-photo-preview__thumb-strip--video">
                                        <VideoPreviewThumbnail
                                            videoRef={this.ref}
                                            article={this.props.article}
                                            onToggleLoading={this.handleToggleLoading}
                                            crop={this.state.crop}
                                            rotate={this.state.degree}
                                        />
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
