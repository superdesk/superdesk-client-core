import * as React from 'react';
// @ts-ignore
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {ISuperdesk, IArticle} from 'superdesk-api';
import {isEmpty, omit, isEqual, cloneDeep} from 'lodash';

import {VideoEditorTools} from './VideoEditorTools';
import {VideoTimeline} from './VideoTimeline/VideoTimeline';
import {VideoEditorHeader} from './VideoEditorHeader';
import {VideoEditorThumbnail} from './VideoEditorThumbnail';
import {IThumbnail, ICrop, IErrorMessage, ITimelineThumbnail} from './interfaces';

interface IProps {
    article: IArticle;
    superdesk: ISuperdesk;
    onClose: () => void;
    onArticleUpdate: (articleUpdate: IArticle) => void;
}

interface IState {
    transformations: {
        trim: {
            start: number;
            end: number;
        };
        crop: ICrop;
        quality: number;
        degree: number;
    };
    cropImg: string;
    thumbnails: Array<IThumbnail>;
    loading: {
        video: boolean,
        thumbnail: boolean,
    };
    loadingText: string;
    scale: number;
    videoSrc: string;
    article: IArticle;
    cropEnabled: boolean;
    playing: boolean;
}

export class VideoEditor extends React.Component<IProps, IState> {
    private videoRef: React.RefObject<HTMLVideoElement>;
    private reactCropRef: React.RefObject<ReactCrop>;
    private intervalThumbnails: number;
    private intervalCheckVideo: number;
    private initTransformations: IState['transformations'];
    private hasTransitionRun: boolean;
    private videoWrapper: HTMLDivElement | null;
    private videoContainerSize: number;
    private videoToolsSize: number;

    constructor(props: IProps) {
        super(props);
        this.videoRef = React.createRef();
        this.reactCropRef = React.createRef();
        this.intervalThumbnails = 0;
        this.intervalCheckVideo = 0;
        this.initTransformations = {
            crop: {
                aspect: 16 / 9,
                unit: 'px',
                scale: 1,
                width: 0,
                height: 0,
                x: 0,
                y: 0,
                value: 0,
            },
            degree: 0,
            trim: {
                start: 0,
                end: 0,
            },
            quality: 0,
        };
        this.state = {
            transformations: this.initTransformations,
            cropEnabled: false,
            cropImg: '',
            playing: false,
            loading: {
                video: false,
                thumbnail: false,
            },
            loadingText: '',
            scale: 1,
            thumbnails: [],
            videoSrc: '',
            article: cloneDeep(this.props.article),
        };
        this.videoWrapper = null;
        this.videoContainerSize = 0;
        this.videoToolsSize = 0;
        this.hasTransitionRun = true;

        this.handleClose = this.handleClose.bind(this);
        this.handleTrim = this.handleTrim.bind(this);
        this.handleRotate = this.handleRotate.bind(this);
        this.handleRotateTransitionEnd = this.handleRotateTransitionEnd.bind(this);
        this.handleCrop = this.handleCrop.bind(this);
        this.handleToggleLoading = this.handleToggleLoading.bind(this);
        this.handleToggleCrop = this.handleToggleCrop.bind(this);
        this.handleToggleVideo = this.handleToggleVideo.bind(this);
        this.handleQualityChange = this.handleQualityChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.getCropRotate = this.getCropRotate.bind(this);
        this.setVideoWrapper = this.setVideoWrapper.bind(this);
        this.setVideoToolsSize = this.setVideoToolsSize.bind(this);
        this.setVideoContainerSize = this.setVideoContainerSize.bind(this);
        this.showErrorMessage = this.showErrorMessage.bind(this);
        this.checkIsDirty = this.checkIsDirty.bind(this);
    }

    componentDidMount() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // initilize image for React Crop
        // this is the boudary of crop area, user can't move, draw crop outside of this so image need
        // to be big enough to cover entire video even once rotated
        canvas.width = 2000;
        canvas.height = 2000;
        if (ctx == null) {
            return;
        }

        ctx.globalAlpha = 0;
        ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
        const {gettext} = this.props.superdesk.localization;

        this.handleToggleLoading(true, gettext('Loading video...'));
        this.handleCheckingVideo(false, () => {
            const text = gettext('Video is editing, please wait...');

            if (this.state.loadingText !== text) {
                this.setState({
                    loadingText: text,
                });
            }
        });
        this.setState({
            cropImg: canvas.toDataURL(),
        });
    }

    componentWillUnmount() {
        clearInterval(this.intervalThumbnails);
        clearInterval(this.intervalCheckVideo);
    }

    handleClose() {
        this.props.onClose();
        this.props.onArticleUpdate(this.state.article);
    }

    handleCheckingVideo(resetState: boolean = true, callback?: () => void) {
        this.intervalCheckVideo = window.setInterval(() => {
            this.props.superdesk.dataApi
                .findOne<IArticle>('video_edit', this.state.article._id + `?t=${Math.random()}`)
                .then((result) => {
                    const processing = result.project?.processing;

                    if (processing?.video === false && processing?.thumbnail_preview === false) {
                        const state = resetState ? this.getResetState() : {};

                        clearInterval(this.intervalCheckVideo);
                        this.setState({
                            ...state,
                            loading: {
                                thumbnail: false,
                                video: false,
                            },
                            thumbnails: [],
                            videoSrc: result.project?.url + `?t=${Math.random()}`,
                            article: {
                                ...this.state.article,
                                ...result,
                            },
                        });
                        this.loadTimelineThumbnails();
                    } else {
                        callback?.();
                    }
                })
                .catch((err: IErrorMessage) => {
                    this.showErrorMessage(err);
                    clearInterval(this.intervalCheckVideo);
                });
        }, 3000);
    }

    handleTrim(start: number, end: number) {
        this.setState({
            transformations: {
                ...this.state.transformations,
                trim: {
                    start: start,
                    end: end,
                },
            },
        });
    }

    handleRotate() {
        this.hasTransitionRun = false;
        const {getClass} = this.props.superdesk.utilities.CSS;
        const classList = this.videoRef.current?.classList;

        if (!classList?.contains(getClass('rotate__transition'))) {
            classList?.add(getClass('rotate__transition'));
        }
        const cropRef = this.reactCropRef.current?.['componentRef'];

        if (cropRef) {
            cropRef.style.visibility = 'hidden';
        }
        this.setState((prevState) => ({
            transformations: {
                ...this.state.transformations,
                degree: prevState.transformations.degree - 90,
            },
            scale: 1,
        }));
    }

    handleRotateTransitionEnd() {
        // avoid transition rerun after set scale
        if (this.hasTransitionRun === true || this.videoRef.current == null) {
            return;
        }
        this.hasTransitionRun = true;
        const {getClass} = this.props.superdesk.utilities.CSS;
        const degree = this.state.transformations.degree % 360 === 0 ? 0 : this.state.transformations.degree;

        // avoid running transition on setting 360 degree to 0
        if (degree === 0) {
            this.videoRef.current.classList.remove(getClass('rotate__transition'));
        }
        const scale = this.getScale();

        let crop = this.state.transformations.crop;

        if (this.state.cropEnabled) {
            const refValue = this.videoRef.current.getBoundingClientRect();
            const currentValue = this.state.transformations.degree % 180 === -90 ? refValue.width : refValue.height;
            // @ts-ignore
            // TODO: reduce complexity
            const delta = (scale / (crop.scale)) * (currentValue / crop.value);

            crop = {
                ...crop,
                aspect: 1 / (crop.aspect ?? 1),
                x: crop.y * delta,
                y: currentValue - (crop.x + crop.width) * delta,
                height: crop.width * delta,
                width: crop.height * delta,
                scale: scale,
                value: currentValue,
            };

            const cropRef = this.reactCropRef.current?.['componentRef'];

            if (cropRef) {
                cropRef.style.visibility = 'unset';
            }
        }
        this.setState({transformations: {...this.state.transformations, degree: degree, crop: crop}, scale: scale});
    }

    handleCrop(newCrop: ICrop) {
        if (newCrop.x == null || newCrop.y == null || newCrop.width == null || newCrop.height == null) {
            throw new Error('Invalid state');
        }
        if (this.videoRef.current == null) {
            throw new Error('Could not load video');
        }

        newCrop.x = Math.floor(newCrop.x);
        newCrop.y = Math.floor(newCrop.y);
        newCrop.width = Math.floor(newCrop.width);
        newCrop.height = Math.floor(newCrop.height);

        // newCrop lost aspect when cropping while rotating sometimes
        if (!newCrop.aspect) {
            newCrop.aspect = this.state.transformations.crop.aspect;
        }

        const refValue = this.videoRef.current.getBoundingClientRect();
        const crop = {
            ...newCrop,
            scale: this.getScale(),
            value: this.state.transformations.degree % 180 === -90 ? refValue.width : refValue.height,
        };

        // when first draw crop area, ReactImageCrop trigger a bulk of change event with the same
        // newCrop value, using throttle with value about 50 did not help much but increase interval
        // may result in lagging
        if (Object.values(this.state.transformations.crop).toString() === Object.values(crop).toString()) {
            return;
        }

        this.setState({transformations: {...this.state.transformations, crop: crop}});
    }

    handleToggleVideo() {
        if (this.state.playing) {
            this.videoRef.current?.pause();
        } else {
            this.videoRef.current?.play();
        }
    }

    handleToggleCrop(aspect: number) {
        const cropAspect = aspect || this.state.transformations.crop.aspect || 0;
        let crop = this.initTransformations.crop;

        if (this.state.cropEnabled === false) {
            crop = this.getInitialCropSize(cropAspect);
        }
        this.setState({
            transformations: {...this.state.transformations, crop: crop},
            cropEnabled: !this.state.cropEnabled,
        });
    }

    handleToggleLoading(isToggle: boolean, text: string = '', type: 'video' | 'thumbnail' = 'video') {
        if (this.state.playing) {
            this.handleToggleVideo();
        }
        this.setState({
            loading: {
                ...this.state.loading,
                [type]: isToggle,
            },
            loadingText: text || this.state.loadingText,
        });
    }

    handleQualityChange(quality: number) {
        if (!this.videoRef.current) {
            return;
        }

        const {videoWidth, videoHeight} = this.videoRef.current;
        const ratio = videoWidth / videoHeight;
        // resolution is calculated based on video height but video editor scale based on video width
        const newQuality = ratio > 1 ? quality : quality * ratio;

        this.setState({transformations: {...this.state.transformations, quality: Math.ceil(newQuality)}});
    }

    handleSave() {
        const {dataApi} = this.props.superdesk;
        const {x, y, width, height} = this.state.transformations.crop;
        const crop = this.getCropRotate({x: x, y: y, width: width, height: height});
        const body = {
            crop: Object.values(crop).join(','),
            rotate: this.state.transformations.degree,
            trim: Object.values(this.state.transformations.trim).join(','),
            scale: this.state.transformations.quality,
        };

        const {gettext} = this.props.superdesk.localization;

        if (body.crop === '0,0,0,0') {
            delete body.crop;
        }
        if (body.rotate === 0) {
            delete body.rotate;
        }
        if (body.trim === `0,${this.videoRef.current?.duration}`) {
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
                    this.handleToggleLoading(true, gettext('Video is editing, please wait...'));
                    this.handleCheckingVideo();
                })
                .catch((err: IErrorMessage) => {
                    this.showErrorMessage(err);
                });
        }
    }

    checkIsDirty() {
        if (this.videoRef.current === null || this.state.transformations.trim.end === 0) {
            return false;
        }

        // ignore trim.end as initState don't load video duration due to videoRef can be null in componentDidMount
        // confirm bar should not be toggled when user change crop aspect
        if (
            this.state.transformations.trim.end !== this.videoRef.current.duration ||
            !isEqual(
                omit(this.state.transformations, ['trim.end', 'crop.aspect', 'crop.value', 'crop.scale']),
                omit(this.initTransformations, ['trim.end', 'crop.aspect', 'crop.value', 'crop.scale']),
            )
        ) {
            return true;
        }
        return false;
    }

    loadTimelineThumbnails() {
        this.intervalThumbnails = window.setInterval(() => {
            this.props.superdesk.dataApi
                .findOne<ITimelineThumbnail>('video_edit', this.state.article._id + '?action=timeline')
                .then((result: ITimelineThumbnail) => {
                    if (result.thumbnails.length > 0) {
                        clearInterval(this.intervalThumbnails);
                        this.setState({thumbnails: result.thumbnails});
                    }
                })
                .catch((err: IErrorMessage) => {
                    // conflict happens when user trigger another video edit right after finished one
                    // error should not be showed as this is not caused by user intentionally
                    if (err.internal_error === 409) {
                        return;
                    }
                    clearInterval(this.intervalThumbnails);
                    this.showErrorMessage(err);
                });
        }, 3000);
    }

    getResetState() {
        return {
            transformations: {
                ...this.initTransformations,
                trim: {
                    start: 0,
                    end: this.videoRef.current?.duration ?? 0,
                },
            },
            cropEnabled: false,
            scale: 1,
        };
    }

    // calculate crop real size as crop value is not based on real video size
    // but scaled video to fit into container
    getCropSize(video: HTMLVideoElement, inputCrop: ICrop): ICrop {
        let {width, height} = video.getBoundingClientRect();

        if (this.state.transformations.degree % 180 !== 0) {
            [width, height] = [height, width];
        }

        const crop = Object.assign({}, inputCrop);
        const scaleX = video.videoWidth / width;
        const scaleY = video.videoHeight / height;

        crop.x = Math.floor(crop.x * scaleX);
        crop.y = Math.floor(crop.y * scaleY);
        crop.width = Math.floor(crop.width * scaleX);
        crop.height = Math.floor(crop.height * scaleY);
        return crop;
    }

    // Set initial crop size to 80% of full video size to make the UX more user-friendly.
    // If it was set to 100%, moving the crop area might not be possible
    // and resize indicators at the corners might not be that clearly visible.
    getInitialCropSize(aspect: number, scale: number = 1) {
        if (this.videoRef.current == null) {
            throw new Error('Could not load video');
        }
        let {width, height} = this.videoRef.current.getBoundingClientRect();

        width = (width * scale * 80) / 100;
        height = (height * scale * 80) / 100;

        const ratio = width / height;

        if (ratio > 1) {
            width = height * aspect;
        } else {
            height = width * aspect;
        }
        return {
            ...this.initTransformations.crop,
            aspect: aspect,
            width: width,
            height: height,
        };
    }

    // get crop value while rotating video
    getCropRotate(crop: ICrop): ICrop {
        if (this.videoRef.current == null) {
            throw new Error('Could not get rotated video crop value');
        }

        const {width: currentWidth, height: currentHeight} = this.videoRef.current.getBoundingClientRect();
        const rotate = this.state.transformations.degree;
        const {x, y, width, height} = crop;

        switch (rotate) {
        case -90:
            return this.getCropSize(
                this.videoRef.current,
                    {
                    ...crop,
                    x: Math.abs(currentHeight - height - y),
                    y: x,
                    width: height,
                    height: width,
                },
            );
        case -180:
            return this.getCropSize(
                this.videoRef.current,
                {
                    ...crop,
                    x: Math.abs(currentWidth - (x + width)),
                    y: Math.abs(currentHeight - (y + height)),
                },
            );
        case -270:
            return this.getCropSize(
                this.videoRef.current,
                {
                    ...crop,
                    x: y,
                    y: Math.abs(currentWidth - width - x),
                    width: height,
                    height: width,
                },
            );
        default:
            return this.getCropSize(this.videoRef.current, crop);
        }
    }

    setVideoWrapper(element: HTMLDivElement) {
        if (element == null) {
            return;
        }
        this.videoWrapper = element;
    }

    setVideoToolsSize(element: HTMLDivElement) {
        if (element == null) {
            return;
        }
        const {height} = element.getBoundingClientRect();
        const {marginTop} = window.getComputedStyle(element);
        // the remain of margin bottom of video tools is too big and overflowed to timeline
        const margin = parseFloat(marginTop) * 2;

        this.videoToolsSize = height + margin;
    }

    setVideoContainerSize(element: HTMLDivElement) {
        if (element == null) {
            return;
        }
        const {marginTop} = window.getComputedStyle(element);

        this.videoContainerSize = parseFloat(marginTop);
    }

    getWrapperHeight() {
        if (this.videoWrapper == null) {
            return 0;
        }
        const {height} = this.videoWrapper.getBoundingClientRect();

        return height - this.videoToolsSize - this.videoContainerSize;
    }

    getScale(): number {
        const videoRef = this.videoRef.current;

        if (!videoRef || videoRef.videoHeight === 0 || this.state.transformations.degree === 0) {
            return 1;
        }

        const videoHeight = this.state.transformations.degree % 180 !== 0 ? videoRef.videoWidth : videoRef.videoHeight;
        const wrapperHeight = this.getWrapperHeight();
        const {height} = videoRef.getBoundingClientRect();
        // ensure video image quality is not broken when scaling up
        const vh = videoHeight < wrapperHeight ? videoHeight : wrapperHeight;
        // round approximate 1 value (e.g. 1.0059880239)
        // avoid running unnecessary transformation transition on resetting state when rotating 360 degree
        const scale = Math.trunc(vh / height * 100) / 100;

        if (scale === 1) {
            return scale;
        }
        return vh / height;
    }

    showErrorMessage(errorResponse: IErrorMessage) {
        const error = Object.values(errorResponse._message).reduce((acc, curr) => acc.concat(curr), []);

        this.props.superdesk.ui.alert(error.join('<br/>'));
    }

    render() {
        const {gettext} = this.props.superdesk.localization;
        const {getClass} = this.props.superdesk.utilities.CSS;
        const degree = this.state.transformations.degree + 'deg';
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
            videoHeight = this.state.transformations.degree % 180 !== 0 ? videoRef.videoWidth : videoRef.videoHeight;
        }
        const isLoading = this.state.loading.video || this.state.loading.thumbnail;

        return (
            <div className="modal modal--fullscreen modal--dark-ui in" style={{zIndex: 1050, display: 'block'}}>
                <div className="modal__dialog">
                    <div className="modal__content">
                        <div className="modal__header modal__header--flex">
                            <h3 className="modal__heading">{gettext('Edit Video')}</h3>
                            <VideoEditorHeader
                                onClose={this.handleClose}
                                onReset={() => this.setState({...this.getResetState()})}
                                onSave={this.handleSave}
                                isDirty={this.checkIsDirty()}
                                isVideoLoading={this.state.loading.video}
                            />
                        </div>
                        <div className="modal__body modal__body--no-padding">
                            {isLoading && (
                                <div className={getClass('loading')}>
                                    <div className={getClass('loading__text')}>{this.state.loadingText}</div>
                                </div>
                            )}
                            <div className="sd-photo-preview sd-photo-preview--edit-video">
                                <div className="sd-photo-preview__video" ref={this.setVideoWrapper}>
                                    <div className="sd-photo-preview__video-inner">
                                        <div
                                            className="sd-photo-preview__video-container"
                                            style={{marginTop: '2rem'}}
                                            ref={this.setVideoContainerSize}
                                        >
                                            <video
                                                ref={this.videoRef}
                                                src={this.state.videoSrc}
                                                onPlay={() => this.setState({playing: true})}
                                                onPause={() => this.setState({playing: false})}
                                                onLoadedData={() => this.handleTrim(0, videoRef?.duration ?? 0)}
                                                style={{
                                                    transform: `rotate(${degree}) scale(${this.state.scale})`,
                                                    height: `${videoHeight}px`,
                                                    // chrome will add extra position for react crop if video has
                                                    // margin top, even if margin of those two are equal
                                                    marginTop: 0,
                                                }}
                                                className={getClass('rotate__transition')}
                                                onTransitionEnd={this.handleRotateTransitionEnd}
                                                autoPlay
                                            />

                                            {this.state.cropEnabled && (
                                                <ReactCrop
                                                    ref={this.reactCropRef}
                                                    src={this.state.cropImg}
                                                    crop={this.state.transformations.crop}
                                                    keepSelection={true}
                                                    onChange={this.handleCrop}
                                                    className={getClass('crop')}
                                                    /* avoid limit height (auto) when video is portrait */
                                                    imageStyle={{maxWidth: 'unset'}}
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
                                            wrapperRef={this.setVideoToolsSize}
                                            onToggleVideo={this.handleToggleVideo}
                                            onRotate={this.handleRotate}
                                            onCrop={this.handleToggleCrop}
                                            onQualityChange={this.handleQualityChange}
                                            cropEnabled={this.state.cropEnabled}
                                            videoDegree={this.state.transformations.degree}
                                            videoPlaying={this.state.playing}
                                            videoQuality={this.state.transformations.quality}
                                            videoHeadline={this.state.article.headline}
                                            videoResolution={Math.min(
                                                videoRef?.videoWidth ?? 0,
                                                videoRef?.videoHeight ?? 0,
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="sd-photo-preview__thumb-strip sd-photo-preview__thumb-strip--video">
                                    {videoRef && (
                                        <>
                                            <VideoEditorThumbnail
                                                video={videoRef}
                                                article={this.state.article}
                                                onToggleLoading={this.handleToggleLoading}
                                                onSave={(article: IArticle) =>
                                                    this.setState({article: {...this.state.article, ...article}})
                                                }
                                                onError={this.showErrorMessage}
                                                crop={this.state.transformations.crop}
                                                rotate={this.state.transformations.degree}
                                                getCropRotate={this.getCropRotate}
                                            />
                                            <VideoTimeline
                                                video={videoRef}
                                                trim={this.state.transformations.trim}
                                                onTrim={this.handleTrim}
                                                thumbnails={this.state.thumbnails}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
