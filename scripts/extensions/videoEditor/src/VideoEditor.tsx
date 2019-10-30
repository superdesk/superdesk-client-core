import * as React from 'react';
// @ts-ignore
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ISuperdesk } from 'superdesk-api';
import { get, isEmpty, omit, pick, isEqual } from 'lodash';

import { VideoEditorTools } from './VideoEditorTools';
import { VideoTimeline } from './VideoTimeline';
import { VideoEditorHeader } from './VideoEditorHeader';
import { VideoEditorProvider } from './VideoEditorContext';
import { VideoPreviewThumbnail } from './VideoPreviewThumbnail';
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
    videoSrc: string;
}

export class VideoEditor extends React.Component<IProps, IState> {
    private videoRef: React.RefObject<HTMLVideoElement>;
    private intervalThumbnails: number;
    private intervalVideoEdit: number;
    private intervalCheckVideo: number;
    private initState: Pick<IState, 'crop' | 'degree' | 'trim' | 'quality'>;

    constructor(props: IProps) {
        super(props);
        this.videoRef = React.createRef();
        this.intervalThumbnails = 0;
        this.intervalVideoEdit = 0;
        this.intervalCheckVideo = 0;
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
            videoSrc: '',
        };
    }

    componentDidMount() {
        const canvas = document.createElement('canvas');
        canvas.width = 2000;
        canvas.height = 2000;
        const ctx = canvas.getContext('2d');
        ctx!.globalAlpha = 0;
        ctx!.fillStyle = 'rgba(0, 0, 200, 0.5)';
        this.handleCheckingVideo();
        this.setState({
            cropImg: canvas.toDataURL(),
        });
    }

    componentWillUnmount() {
        clearInterval(this.intervalThumbnails);
        clearInterval(this.intervalVideoEdit);
        clearInterval(this.intervalCheckVideo);
    }
    handleCheckingVideo = () => {
        this.handleToggleLoading(true);
        this.intervalCheckVideo = window.setInterval(() => {
            this.props.superdesk.dataApi
                .findOne('video_edit', this.props.article._id + `?t=${Math.random()}`)
                .then((result: any) => {
                    if (result.project.processing.video == false) {
                        clearInterval(this.intervalCheckVideo);
                        this.handleToggleLoading(false);
                        this.handleReset();
                        this.setState({
                            videoSrc: this.videoRef.current!.src = result.project.url + `?t=${Math.random()}`,
                        });
                        this.loadTimelineThumbnails();
                    }
                })
                .catch(() => {
                    clearInterval(this.intervalCheckVideo);
                });
        }, 3000);
    };

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
            this.videoRef.current!.pause();
        } else {
            this.videoRef.current!.play();
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
                let { width, height } = this.videoRef.current!.getBoundingClientRect();
                width = (width * 80) / 100;
                height = (height * 80) / 100;

                const ratio = width / height;
                if (ratio > 1) {
                    width = height * cropAspect;
                } else {
                    height = width * cropAspect;
                }
                this.setState(
                    {
                        crop: {
                            ...this.initState.crop,
                            aspect: cropAspect,
                            width: width,
                            height: height,
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
                end: this.videoRef.current!.duration,
            },
            isDirty: false,
            cropEnabled: false,
        });
    };

    handleSave = () => {
        const { dataApi } = this.props.superdesk;
        const crop = pick(this.state.crop, ['x', 'y', 'width', 'height']);
        const body = {
            crop: Object.values(crop).join(','),
            rotate: this.state.degree,
            trim: Object.values(this.state.trim).join(','),
            scale: this.state.quality,
        };
        if (body.crop === '0,0,0,0') {
            delete body.crop;
        }
        if (body.rotate === 0) {
            delete body.rotate;
        }
        if (body.trim === `0,${this.videoRef.current!.duration}`) {
            delete body.trim;
        }
        if (body.scale === 0) {
            delete body.scale;
        }
        if (!isEmpty(body)) {
            dataApi
                .create('video_edit', {
                    edit: body,
                    item: this.props.article,
                })
                .then(() => {
                    this.setState({ isDirty: false });
                    this.handleToggleLoading(true);
                    this.intervalVideoEdit = window.setInterval(() => {
                        this.props.superdesk.dataApi
                            .findOne('video_edit', this.props.article._id + `?t=${Math.random()}`)
                            .then((result: any) => {
                                if (result.project.processing.video == false) {
                                    clearInterval(this.intervalVideoEdit);
                                    this.handleToggleLoading(false);
                                    this.handleReset();
                                    this.setState({
                                        thumbnails: [],
                                        videoSrc: this.videoRef.current!.src =
                                            result.project.url + `?t=${Math.random()}`,
                                    });
                                    this.loadTimelineThumbnails();
                                }
                            })
                            .catch(() => {
                                clearInterval(this.intervalVideoEdit);
                            });
                    }, 3000);
                });
        }
    };

    checkIsDirty = () => {
        const state = pick(this.state, ['crop', 'trim', 'degree', 'quality']);
        // ignore trim.end as initState don't load video duration due to videoRef can be null when component did mount
        // confirm bar should not be toggled when user change crop aspect
        if (
            state.trim.end !== this.videoRef.current!.duration ||
            !isEqual(omit(state, ['trim.end', 'crop.aspect']), omit(this.initState, ['trim.end', 'crop.aspect']))
        ) {
            this.setState({ isDirty: true });
        } else {
            this.setState({ isDirty: false });
        }
    };

    loadTimelineThumbnails = () => {
        this.intervalThumbnails = window.setInterval(() => {
            this.props.superdesk.dataApi
                .findOne('video_edit', this.props.article._id + `?t=${Math.random()}`)
                .then((result: any) => {
                    if (!isEmpty(result.project.thumbnails.timeline)) {
                        clearInterval(this.intervalThumbnails);
                        this.setState({ thumbnails: result.project.thumbnails.timeline });
                    } else {
                        !result.project.processing.thumbnails_timeline &&
                            this.props.superdesk.dataApi.findOne(
                                'video_edit',
                                this.props.article._id + `?action=timeline&t=${Math.random()}`
                            );
                    }
                })
                .catch(() => {
                    clearInterval(this.intervalThumbnails);
                });
        }, 3000);
    };

    // calculate crop real size as crop value is not based on real video size
    // but scaled video to fit into container
    getCropSize = (inputCrop: IVideoEditor['crop']): IVideoEditor['crop'] => {
        const video = this.videoRef.current!;
        const rect = video.getBoundingClientRect();

        const crop = { ...inputCrop };
        const scaleX = video.videoWidth / rect.width;
        const scaleY = video.videoHeight / rect.height;
        crop.x = Math.round(crop.x! * scaleX);
        crop.y = Math.round(crop.y! * scaleY);
        crop.width = Math.round(crop.width! * scaleX);
        crop.height = Math.round(crop.height! * scaleY);
        return crop;
    };

    render() {
        const { gettext } = this.props.superdesk.localization;
        const { getClass } = this.props.superdesk.utilities.CSS;
        const degree = this.state.degree + 'deg';
        const { width, height } = (this.videoRef.current && this.videoRef.current.getBoundingClientRect()) || {
            width: 0,
            height: 0,
        };

        const { videoWidth, videoHeight } = this.videoRef.current! || { videoWidth: 1, videoHeight: 1 };
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
                                            <div
                                                className="sd-photo-preview__video-container"
                                                style={{ alignItems: 'unset' }} // remove space between video and ReactCrop
                                            >
                                                <video
                                                    ref={this.videoRef}
                                                    src={this.state.videoSrc}
                                                    onPlay={() => this.setState({ playing: true })}
                                                    onPause={() => this.setState({ playing: false })}
                                                    onLoadedData={() =>
                                                        this.handleTrim(0, this.videoRef.current!.duration)
                                                    }
                                                    style={{ transform: `rotate(${degree}) scale(${scaleRatio})` }}
                                                    autoPlay
                                                ></video>

                                                {this.state.cropEnabled && (
                                                    <ReactCrop
                                                        src={this.state.cropImg}
                                                        crop={this.state.crop}
                                                        onChange={(newCrop: ReactCrop.Crop) => {
                                                            ['x', 'y', 'width', 'height'].map(
                                                                key => (newCrop[key] = Math.round(newCrop[key]))
                                                            );
                                                            this.setState(
                                                                { crop: Object.assign({}, this.state.crop, newCrop) },
                                                                this.checkIsDirty
                                                            );
                                                        }}
                                                        className={getClass('video__crop')}
                                                        style={{
                                                            width: width,
                                                            height: height,
                                                            background: 'unset',
                                                            position: 'absolute',
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
                                                videoHeight={get(this.videoRef.current, 'videoHeight')}
                                            />
                                        </div>
                                    </div>
                                    <div className="sd-photo-preview__thumb-strip sd-photo-preview__thumb-strip--video">
                                        <VideoPreviewThumbnail
                                            videoRef={this.videoRef}
                                            article={this.props.article}
                                            onToggleLoading={this.handleToggleLoading}
                                            crop={this.state.crop}
                                            rotate={this.state.degree}
                                            getCropSize={this.getCropSize}
                                        />
                                        <VideoTimeline
                                            video={this.videoRef}
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
