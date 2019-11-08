import * as React from 'react';
// @ts-ignore
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ISuperdesk, IArticle } from 'superdesk-api';
import { get, isEmpty, omit, pick, isEqual, cloneDeep, flatten } from 'lodash';

import { VideoEditorTools } from './VideoEditorTools';
import { VideoTimeline } from './VideoTimeline';
import { VideoEditorHeader } from './VideoEditorHeader';
import { VideoEditorProvider } from './VideoEditorContext';
import { VideoEditorThumbnail } from './VideoEditorThumbnail';
import { IArticleVideo, IVideoEditor, IThumbnail } from './interfaces';

interface IProps {
    article: IArticleVideo;
    superdesk: ISuperdesk;
    onClose: () => void;
    onArticleUpdate: (articleUpdate: IArticle) => void;
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
    loadingText: string;
    scale: number;
    videoSrc: string;
    article: IArticleVideo;
}

export class VideoEditor extends React.Component<IProps, IState> {
    private videoRef: React.RefObject<HTMLVideoElement>;
    private reactCropRef: React.RefObject<ReactCrop>;
    private reactCropWrapperRef: React.RefObject<HTMLDivElement>;
    private intervalThumbnails: number;
    private intervalVideoEdit: number;
    private intervalCheckVideo: number;
    private initState: Pick<IState, 'crop' | 'degree' | 'trim' | 'quality'>;
    private reactCropMarginDelta: number;
    wrapperSize: { width: number; height: number };

    constructor(props: IProps) {
        super(props);
        this.videoRef = React.createRef();
        this.reactCropRef = React.createRef();
        this.reactCropWrapperRef = React.createRef();
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
            loadingText: '',
            scale: 1,
            thumbnails: [],
            videoSrc: '',
            article: cloneDeep(this.props.article),
        };
        this.wrapperSize = { width: 0, height: 0 };
        this.reactCropMarginDelta = 0;
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

    handleClose = () => {
        this.props.onClose();
        this.props.onArticleUpdate(cloneDeep(this.state.article));
    };
    handleCheckingVideo = () => {
        this.handleToggleLoading(true, 'Loading video...');
        this.intervalCheckVideo = window.setInterval(() => {
            this.props.superdesk.dataApi
                .findOne('video_edit', this.state.article._id + `?t=${Math.random()}`)
                .then((result: any) => {
                    if (result.project.processing.video == false) {
                        this.handleToggleLoading(false);
                        clearInterval(this.intervalCheckVideo);
                        this.setState({
                            videoSrc: result.project.url + `?t=${Math.random()}`,
                            article: {
                                ...this.state.article,
                                ...omit(result, 'project'),
                            },
                        });
                        this.loadTimelineThumbnails();
                    } else {
                        this.setState({ loadingText: 'Video is editing, please wait...' });
                    }
                })
                .catch((err: any) => {
                    this.showErrorMessage(err);
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
            prevState => ({ degree: prevState.degree - 90, scale: 1 }),
            () => {
                const degree = this.state.degree % 360 === 0 ? 0 : this.state.degree;
                let crop = this.initState.crop;
                const scale = this.getScale();
                if (this.state.cropEnabled) {
                    crop = this.getCropSample(this.state.crop.aspect!, scale);
                }
                this.setState({ degree: degree, crop: crop, scale: scale }, this.checkIsDirty);
            }
        );
    };

    handleCrop = (newCrop: IVideoEditor['crop']) => {
        // @ts-ignore
        ['x', 'y', 'width', 'height'].map(key => (newCrop[key] = Math.floor(newCrop[key])));
        // newCrop lost aspect when cropping while rotating sometimes
        if (!newCrop.aspect) {
            newCrop.aspect = this.state.crop.aspect;
        }

        // when first draw crop zone, ReactImageCrop trigger a bulk of change event with the same
        // newCrop value, using throttle with value about 50 did not help much but increase interval may result in lagging
        if (Object.values(this.state.crop).toString() === Object.values(newCrop).toString()) {
            return;
        }

        this.setState({ crop: newCrop }, this.checkIsDirty);
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
        let crop = this.initState.crop;

        if (this.state.cropEnabled === false) {
            crop = this.getCropSample(cropAspect);
        }
        this.reactCropMarginDelta = 0;
        this.setState({ cropEnabled: !this.state.cropEnabled, crop: crop }, () => {
            this.checkIsDirty();
            // chrome adds 1rem extra (ghost) margin to ReactCrop cause crop area and video mismatch
            if (this.reactCropRef.current != null) {
                const element = get(this.reactCropRef.current, 'componentRef');
                const { top } = element.getBoundingClientRect();
                const { top: wrapperTop } = this.reactCropWrapperRef.current!.getBoundingClientRect();
                this.reactCropMarginDelta = top - wrapperTop - 20;
            }
        });
    };

    handleToggleLoading = (isToggle: boolean, text: string = '') => {
        if (this.state.playing) {
            this.handleToggleVideo();
        }
        this.setState({ loading: isToggle, loadingText: text || this.state.loadingText });
    };

    handleQualityChange = (quality: number) => {
        this.setState({ quality: quality }, this.checkIsDirty);
    };

    handleReset = () => {
        this.setState(
            {
                ...this.initState,
                trim: {
                    start: 0,
                    end: this.videoRef.current!.duration,
                },
                isDirty: false,
                cropEnabled: false,
                scale: 1,
            },
            () => {
                this.setState({
                    scale: this.getScale(),
                });
            }
        );
    };

    handleSave = () => {
        const { dataApi } = this.props.superdesk;
        const crop = this.getCropRotate(pick(this.state.crop, ['x', 'y', 'width', 'height']));
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
                    item: this.state.article,
                })
                .then(() => {
                    this.setState({ isDirty: false });
                    this.handleToggleLoading(true, 'Video is editing, please wait...');
                    this.intervalVideoEdit = window.setInterval(() => {
                        this.props.superdesk.dataApi
                            .findOne('video_edit', this.state.article._id + `?t=${Math.random()}`)
                            .then((result: any) => {
                                if (result.project.processing.video == false) {
                                    clearInterval(this.intervalVideoEdit);
                                    this.handleToggleLoading(false);
                                    this.handleReset();
                                    this.setState({
                                        thumbnails: [],
                                        videoSrc: result.project.url + `?t=${Math.random()}`,
                                        article: {
                                            ...this.state.article,
                                            ...omit(result, 'project'),
                                        },
                                    });
                                    this.loadTimelineThumbnails();
                                }
                            });
                    }, 3000);
                })
                .catch((err: any) => {
                    this.showErrorMessage(err);
                    clearInterval(this.intervalVideoEdit);
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
                .findOne('video_edit', this.state.article._id + `?t=${Math.random()}`)
                .then((result: any) => {
                    if (!isEmpty(result.project.thumbnails.timeline)) {
                        clearInterval(this.intervalThumbnails);
                        this.setState({ thumbnails: result.project.thumbnails.timeline });
                    } else {
                        !result.project.processing.thumbnails_timeline &&
                            this.props.superdesk.dataApi.findOne(
                                'video_edit',
                                this.state.article._id + `?action=timeline&t=${Math.random()}`
                            );
                    }
                })
                .catch((err: any) => {
                    this.showErrorMessage(err);
                    clearInterval(this.intervalThumbnails);
                });
        }, 3000);
    };

    // calculate crop real size as crop value is not based on real video size
    // but scaled video to fit into container
    getCropSize = (inputCrop: IVideoEditor['crop']): IVideoEditor['crop'] => {
        const video = this.videoRef.current!;
        let { width, height } = video.getBoundingClientRect();
        if (this.state.degree % 180 !== 0) {
            [width, height] = [height, width];
        }

        const crop = Object.assign({}, inputCrop);
        const scaleX = video.videoWidth / width;
        const scaleY = video.videoHeight / height;
        crop.x = Math.floor(crop.x! * scaleX);
        crop.y = Math.floor(crop.y! * scaleY);
        crop.width = Math.floor(crop.width! * scaleX);
        crop.height = Math.floor(crop.height! * scaleY);
        return crop;
    };

    // calculate sample crop zone, only draw 80% instead of full width / height so user can easily resize, move
    getCropSample = (aspect: number, scale: number = 1) => {
        let { width, height } = this.videoRef.current!.getBoundingClientRect();
        width = (width * scale * 80) / 100;
        height = (height * scale * 80) / 100;

        const ratio = width / height;
        if (ratio > 1) {
            width = height * aspect!;
        } else {
            height = width * aspect!;
        }
        return {
            ...this.initState.crop,
            aspect: aspect,
            width: width,
            height: height,
        };
    };

    // get crop value while rotating video
    getCropRotate = (crop: IVideoEditor['crop']): IVideoEditor['crop'] => {
        const { width: currentWidth, height: currentHeight } = this.videoRef.current!.getBoundingClientRect();
        const rotate = this.state.degree;
        const { x, y, width, height } = crop;
        // do not use state cropEnabled, because user can toggle crop then capture without draw crop zone
        if ([x, y, width, height].filter(value => value !== 0).length === 0) return this.getCropSize(crop);

        switch (rotate) {
            case -90:
                return this.getCropSize({
                    ...crop,
                    x: Math.abs(currentHeight - height! - y!),
                    y: x!,
                    width: height!,
                    height: width!,
                });
            case -180:
                return this.getCropSize({
                    ...crop,
                    x: Math.abs(currentWidth - (x! + width!)),
                    y: Math.abs(currentHeight - (y! + height!)),
                });
            case -270:
                return this.getCropSize({
                    ...crop,
                    x: y!,
                    y: Math.abs(currentWidth - width! - x!),
                    width: height!,
                    height: width!,
                });
            default:
                return this.getCropSize(crop);
        }
    };

    // get wrapper size dynamically to scale video so that it's not too small or too big
    getWrapperSize = (element: any) => {
        if (element == null) return;
        const { width, height } = element.getBoundingClientRect();
        this.wrapperSize = {
            width: width,
            height: height - 100, // subtract VideoEditorTools size and video margin
        };
    };

    getScale = (): number => {
        if (!this.videoRef.current || this.videoRef.current.videoHeight === 0) return 1;
        const videoHeight =
            this.state.degree % 180 !== 0 ? this.videoRef.current.videoWidth : this.videoRef.current.videoHeight;
        const { height } = this.videoRef.current.getBoundingClientRect();
        // ensure video image quality is not broken when scaling up
        const vh = videoHeight < this.wrapperSize.height ? videoHeight : this.wrapperSize.height;
        return vh / height;
    };

    showErrorMessage = (errorResponse: any) => {
        const message = JSON.parse(errorResponse._message) || {};
        this.props.superdesk.ui.alert(flatten(Object.values(message)).join('<br/>'));
    };

    render() {
        const { gettext } = this.props.superdesk.localization;
        const { getClass } = this.props.superdesk.utilities.CSS;
        const degree = this.state.degree + 'deg';

        let width = 0,
            height = 0,
            videoHeight = 1;
        if (this.videoRef.current != null) {
            ({ width, height } = this.videoRef.current.getBoundingClientRect());
            videoHeight =
                this.state.degree % 180 !== 0 ? this.videoRef.current.videoWidth : this.videoRef.current.videoHeight;
        }

        return (
            <VideoEditorProvider value={{ superdesk: this.props.superdesk }}>
                <div className="modal modal--fullscreen modal--dark-ui in" style={{ zIndex: 1050, display: 'block' }}>
                    <div className="modal__dialog">
                        <div className="modal__content">
                            <div className="modal__header modal__header--flex">
                                <h3 className="modal__heading">{gettext('Edit Video')}</h3>
                                <VideoEditorHeader
                                    onClose={this.handleClose}
                                    onReset={this.handleReset}
                                    onSave={this.handleSave}
                                    isDirty={this.state.isDirty}
                                />
                            </div>
                            <div className="modal__body modal__body--no-padding">
                                {this.state.loading && (
                                    <div className={getClass('video__loading')}>
                                        <div className={getClass('video__loading__text')}>{this.state.loadingText}</div>
                                    </div>
                                )}
                                <div className="sd-photo-preview sd-photo-preview--edit-video">
                                    <div className="sd-photo-preview__video" ref={this.getWrapperSize}>
                                        <div className="sd-photo-preview__video-inner">
                                            <div
                                                className="sd-photo-preview__video-container"
                                                ref={this.reactCropWrapperRef}
                                            >
                                                <video
                                                    ref={this.videoRef}
                                                    src={this.state.videoSrc}
                                                    onPlay={() => this.setState({ playing: true })}
                                                    onPause={() => this.setState({ playing: false })}
                                                    onLoadedData={() =>
                                                        this.handleTrim(0, this.videoRef.current!.duration)
                                                    }
                                                    style={{
                                                        transform: `rotate(${degree}) scale(${this.state.scale})`,
                                                        height: `${videoHeight}px`,
                                                    }}
                                                    autoPlay
                                                ></video>

                                                {this.state.cropEnabled && (
                                                    <ReactCrop
                                                        ref={this.reactCropRef}
                                                        src={this.state.cropImg}
                                                        crop={this.state.crop}
                                                        onChange={this.handleCrop}
                                                        className={getClass('video__crop')}
                                                        style={{
                                                            width: width,
                                                            height: height,
                                                            background: 'unset',
                                                            position: 'absolute',
                                                            margin: `calc(3rem - ${this.reactCropMarginDelta}px) auto 1rem`,
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
                                                videoHeadline={this.state.article.headline}
                                                videoHeight={get(this.videoRef.current, 'videoHeight')}
                                            />
                                        </div>
                                    </div>
                                    <div className="sd-photo-preview__thumb-strip sd-photo-preview__thumb-strip--video">
                                        <VideoEditorThumbnail
                                            videoRef={this.videoRef}
                                            article={this.state.article}
                                            onToggleLoading={this.handleToggleLoading}
                                            onSave={(article: IArticleVideo) =>
                                                this.setState({ article: { ...this.state.article, ...article } })
                                            }
                                            onError={this.showErrorMessage}
                                            crop={this.state.crop}
                                            rotate={this.state.degree}
                                            getCropRotate={this.getCropRotate}
                                        />
                                        <VideoTimeline
                                            video={this.videoRef}
                                            trim={this.state.trim}
                                            onTrim={this.handleTrim}
                                            thumbnails={this.state.thumbnails}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </VideoEditorProvider>
        );
    }
}
