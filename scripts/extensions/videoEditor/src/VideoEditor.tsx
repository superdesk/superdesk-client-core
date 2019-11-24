import * as React from 'react';
// @ts-ignore
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {ISuperdesk, IArticle} from 'superdesk-api';
import {isEmpty, omit, pick, isEqual, cloneDeep, flatten} from 'lodash';

import {VideoEditorTools} from './VideoEditorTools';
import {VideoTimeline} from './VideoTimeline/VideoTimeline';
import {VideoEditorHeader} from './VideoEditorHeader';
import {VideoEditorThumbnail} from './VideoEditorThumbnail';
import {IVideoEditor, IThumbnail} from './interfaces';

interface IProps {
    article: IArticle;
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
    article: IArticle;
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
    private hasTransitionRun: boolean;
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
            crop: {aspect: 16 / 9, unit: 'px', scale: 1, width: 0, height: 0, x: 0, y: 0, value: 0},
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
        this.wrapperSize = {width: 0, height: 0};
        this.reactCropMarginDelta = 0;
        this.hasTransitionRun = true;
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
        const omitFields = [
            'annotations',
            'project',
            'semantics',
            'time_zone',
            '_editable',
            '_locked',
            '_type',
            '_status',
            '_latest_version',
        ];

        this.props.onArticleUpdate(omit(cloneDeep(this.state.article), omitFields) as IArticle);
    }

    handleCheckingVideo = () => {
        this.handleToggleLoading(true, 'Loading video...');
        this.intervalCheckVideo = window.setInterval(() => {
            this.props.superdesk.dataApi
                .findOne('video_edit', this.state.article._id + `?t=${Math.random()}`)
                .then((result: any) => {
                    if (result.project.processing.video === false) {
                        this.handleToggleLoading(false);
                        clearInterval(this.intervalCheckVideo);
                        this.setState({
                            videoSrc: result.project.url + `?t=${Math.random()}`,
                            article: {
                                ...this.state.article,
                                ...result,
                            },
                        });
                        this.loadTimelineThumbnails();
                    } else {
                        this.setState({loadingText: 'Video is editing, please wait...'});
                    }
                })
                .catch((err: any) => {
                    this.showErrorMessage(err);
                    clearInterval(this.intervalCheckVideo);
                });
        }, 3000);
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
                if (runCheckIsDirty) {
                    this.checkIsDirty();
                }
            },
        );
    }

    handleRotate = () => {
        this.hasTransitionRun = false;
        const {getClass} = this.props.superdesk.utilities.CSS;
        const classList = this.videoRef.current!.classList;

        if (!classList.contains(getClass('video__rotate__transition'))) {
            classList.add(getClass('video__rotate__transition'));
        }
        const cropRef = this.reactCropRef.current?.['componentRef'];

        if (cropRef) {
            cropRef.style.visibility = 'hidden';
        }
        this.setState((prevState) => ({degree: prevState.degree - 90, scale: 1}));
    }

    handleRotateTransitionEnd = () => {
        // avoid transition rerun after set scale
        if (this.hasTransitionRun === true) {
            return;
        }
        this.hasTransitionRun = true;
        const {getClass} = this.props.superdesk.utilities.CSS;
        const degree = this.state.degree % 360 === 0 ? 0 : this.state.degree;
        // avoid running transition on setting 360 degree to 0

        if (degree === 0) {
            this.videoRef.current!.classList.remove(getClass('video__rotate__transition'));
        }
        const scale = this.getScale();

        let crop = this.state.crop;

        if (this.state.cropEnabled) {
            let refValue = this.videoRef.current!.getBoundingClientRect();
            let currentValue = this.state.degree % 180 === -90 ? refValue.width : refValue.height;
            let delta = (scale / crop.scale!) * (currentValue / crop.value!);

            crop = {
                ...crop,
                aspect: 1 / crop.aspect!,
                x: crop.y! * delta,
                y: currentValue! - (crop.x! + crop.width!) * delta,
                height: crop.width! * delta,
                width: crop.height! * delta,
                scale: scale,
                value: currentValue,
            };

            const cropRef = this.reactCropRef.current?.['componentRef'];

            if (cropRef) {
                cropRef.style.visibility = 'unset';
            }
        }
        this.setState({degree: degree, crop: crop, scale: scale}, this.checkIsDirty);
    }

    handleCrop = (newCrop: IVideoEditor['crop']) => {
        if (
            newCrop.x == null
            || newCrop.y == null
            || newCrop.width == null
            || newCrop.height == null
        ) {
            throw new Error('Invalid state');
        }

        newCrop.x = Math.floor(newCrop.x);
        newCrop.y = Math.floor(newCrop.y);
        newCrop.width = Math.floor(newCrop.width);
        newCrop.height = Math.floor(newCrop.height);

        // newCrop lost aspect when cropping while rotating sometimes
        if (!newCrop.aspect) {
            newCrop.aspect = this.state.crop.aspect;
        }

        let refValue = this.videoRef.current!.getBoundingClientRect();

        const crop = {
            ...newCrop,
            scale: this.getScale(),
            value: this.state.degree % 180 === -90 ? refValue.width : refValue.height,
        };

        // when first draw crop zone, ReactImageCrop trigger a bulk of change event with the same
        // newCrop value, using throttle with value about 50 did not help much but increase interval \
        // may result in lagging
        if (Object.values(this.state.crop).toString() === Object.values(crop).toString()) {
            return;
        }

        this.setState({crop: crop}, this.checkIsDirty);
    }

    handleToggleVideo = () => {
        if (this.state.playing) {
            this.videoRef.current!.pause();
        } else {
            this.videoRef.current!.play();
        }
    }

    handleToggleCrop = (aspect: number) => {
        const cropAspect = aspect || this.state.crop.aspect || 0;
        let crop = this.initState.crop;

        if (this.state.cropEnabled === false) {
            crop = this.getCropSample(cropAspect);
        }
        this.reactCropMarginDelta = 0;
        this.setState({cropEnabled: !this.state.cropEnabled, crop: crop}, () => {
            this.checkIsDirty();
            // chrome adds 1rem extra (ghost) margin to ReactCrop cause crop area and video mismatch
            if (this.reactCropRef.current != null) {
                const element = this.reactCropRef.current?.['componentRef'];
                const {top} = element.getBoundingClientRect();
                const {top: wrapperTop} = this.reactCropWrapperRef.current!.getBoundingClientRect();

                this.reactCropMarginDelta = top - wrapperTop - 20;
            }
        });
    }

    handleToggleLoading = (isToggle: boolean, text: string = '') => {
        if (this.state.playing) {
            this.handleToggleVideo();
        }
        this.setState({
            loading: isToggle,
            loadingText: text || this.state.loadingText,
        });
    }

    handleQualityChange = (quality: number) => {
        if (!this.videoRef.current) {
            return;
        }

        const {videoWidth, videoHeight} = this.videoRef.current;
        const ratio = videoWidth / videoHeight;
        // resolution is calculated based on video height but video editor scale based on video width
        const newQuality = ratio > 1 ? quality : quality * ratio;

        this.setState({quality: Math.ceil(newQuality)}, this.checkIsDirty);
    }

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
            },
        );
    }

    handleSave = () => {
        const {dataApi} = this.props.superdesk;
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
                    this.setState({isDirty: false});
                    this.handleToggleLoading(true, 'Video is editing, please wait...');
                    this.intervalVideoEdit = window.setInterval(() => {
                        this.props.superdesk.dataApi
                            .findOne('video_edit', this.state.article._id + `?t=${Math.random()}`)
                            .then((result: any) => {
                                if (result.project.processing.video === false) {
                                    clearInterval(this.intervalVideoEdit);
                                    this.handleToggleLoading(false);
                                    this.handleReset();
                                    this.setState({
                                        thumbnails: [],
                                        videoSrc: result.project.url + `?t=${Math.random()}`,
                                        article: {
                                            ...this.state.article,
                                            ...result,
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
    }

    checkIsDirty = () => {
        const state = pick(this.state, ['crop', 'trim', 'degree', 'quality']);
        // ignore trim.end as initState don't load video duration due to videoRef can be null when component did mount
        // confirm bar should not be toggled when user change crop aspect

        if (
            state.trim.end !== this.videoRef.current!.duration ||
            !isEqual(
                omit(state, ['trim.end', 'crop.aspect', 'crop.value', 'crop.scale']),
                omit(this.initState, ['trim.end', 'crop.aspect', 'crop.value', 'crop.scale']),
            )
        ) {
            this.setState({isDirty: true});
        } else {
            this.setState({isDirty: false});
        }
    }

    loadTimelineThumbnails = () => {
        this.intervalThumbnails = window.setInterval(() => {
            this.props.superdesk.dataApi
                .findOne('video_edit', this.state.article._id + `?t=${Math.random()}`)
                .then((result: any) => {
                    if (!isEmpty(result.project.thumbnails.timeline)) {
                        clearInterval(this.intervalThumbnails);
                        this.setState({thumbnails: result.project.thumbnails.timeline});
                    } else if (!result.project.processing.thumbnails_timeline) {
                        this.props.superdesk.dataApi.findOne(
                            'video_edit',
                            this.state.article._id + `?action=timeline&t=${Math.random()}`,
                        );
                    }
                })
                .catch((err: any) => {
                    this.showErrorMessage(err);
                    clearInterval(this.intervalThumbnails);
                });
        }, 3000);
    }

    // calculate crop real size as crop value is not based on real video size
    // but scaled video to fit into container
    getCropSize = (inputCrop: IVideoEditor['crop']): IVideoEditor['crop'] => {
        const video = this.videoRef.current!;
        let {width, height} = video.getBoundingClientRect();

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
    }

    // calculate sample crop zone, only draw 80% instead of full width / height so user can easily resize, move
    getCropSample = (aspect: number, scale: number = 1) => {
        let {width, height} = this.videoRef.current!.getBoundingClientRect();

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
    }

    // get crop value while rotating video
    getCropRotate = (crop: IVideoEditor['crop']): IVideoEditor['crop'] => {
        const {width: currentWidth, height: currentHeight} = this.videoRef.current!.getBoundingClientRect();
        const rotate = this.state.degree;
        const {x, y, width, height} = crop;
        // do not use state cropEnabled, because user can toggle crop then capture without draw crop zone

        if ([x, y, width, height].filter((value) => value !== 0).length === 0) {
            return this.getCropSize(crop);
        }

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
    }

    // get wrapper size dynamically to scale video so that it's not too small or too big
    getWrapperSize = (element: any) => {
        if (element == null) {
            return;
        }
        const {width, height} = element.getBoundingClientRect();

        this.wrapperSize = {
            width: width,
            height: height - 100, // subtract VideoEditorTools size and video margin
        };
    }

    getScale = (): number => {
        const videoRef = this.videoRef.current;

        if (!videoRef || videoRef.videoHeight === 0 || this.state.degree === 0) {
            return 1;
        }

        const videoHeight = this.state.degree % 180 !== 0 ? videoRef.videoWidth : videoRef.videoHeight;
        const {height} = videoRef.getBoundingClientRect();
        // ensure video image quality is not broken when scaling up
        const vh = videoHeight < this.wrapperSize.height ? videoHeight : this.wrapperSize.height;

        return vh / height;
    }

    showErrorMessage = (errorResponse: any) => {
        const message = JSON.parse(errorResponse._message) || {};
        const error: Array<string> = flatten(Object.values(message)).map((x) => {
            if (typeof x === 'object') {
                return JSON.stringify(x);
            }
            return x;
        });

        this.props.superdesk.ui.alert(error.join('<br/>'));
    }

    render() {
        const {gettext} = this.props.superdesk.localization;
        const {getClass} = this.props.superdesk.utilities.CSS;
        const degree = this.state.degree + 'deg';
        const videoRef = this.videoRef.current;

        let width = 0,
            height = 0,
            videoHeight = 1;

        if (videoRef != null) {
            const scale = this.getScale();

            ({width, height} = videoRef.getBoundingClientRect());
            if (scale !== 1) {
                // video has not applied scale yet so ReactCrop will exceed video size
                width = width * scale;
                height = height * scale;
            }
            videoHeight = this.state.degree % 180 !== 0 ? videoRef.videoWidth : videoRef.videoHeight;
        }

        return (
            <div className="modal modal--fullscreen modal--dark-ui in" style={{zIndex: 1050, display: 'block'}}>
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
                                                onPlay={() => this.setState({playing: true})}
                                                onPause={() => this.setState({playing: false})}
                                                onLoadedData={() => this.handleTrim(0, videoRef!.duration)}
                                                style={{
                                                    transform: `rotate(${degree}) scale(${this.state.scale})`,
                                                    height: `${videoHeight}px`,
                                                }}
                                                className={getClass('video__rotate__transition')}
                                                onTransitionEnd={this.handleRotateTransitionEnd}
                                                autoPlay
                                            />

                                            {this.state.cropEnabled && (
                                                <ReactCrop
                                                    ref={this.reactCropRef}
                                                    src={this.state.cropImg}
                                                    crop={this.state.crop}
                                                    keepSelection={true}
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
                                            videoResolution={Math.min(
                                                videoRef?.videoWidth ?? 0,
                                                videoRef?.videoHeight ?? 0,
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="sd-photo-preview__thumb-strip sd-photo-preview__thumb-strip--video">
                                    <VideoEditorThumbnail
                                        videoRef={this.videoRef}
                                        article={this.state.article}
                                        onToggleLoading={this.handleToggleLoading}
                                        onSave={(article: IArticle) =>
                                            this.setState({
                                                article: {...this.state.article, ...article},
                                            })
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
        );
    }
}
