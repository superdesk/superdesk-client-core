import * as React from 'react';
import {IArticle, ISuperdesk} from 'superdesk-api';
import {IErrorMessage, ICrop, IVideoProject} from './interfaces';
import {pick} from 'lodash';

interface IProps {
    video: HTMLVideoElement;
    article: IArticle;
    crop: ICrop;
    rotate: number;
    superdesk: ISuperdesk;
    onToggleLoading: (isLoading: boolean, loadingText?: string, type?: 'video' | 'thumbnail') => void;
    onSave: (renditions: IArticle['renditions'], etag: string) => void;
    onError: (err: IErrorMessage) => void;
    getCropRotate: (crop: ICrop) => ICrop;
}

interface IState {
    type: 'capture' | 'upload' | null;
    value: number | File; // capture positon or uploaded File
    rotateDegree: number; // save current rotate degree when user captures thumbnail
    scale: number;
}

interface IThumbnailCaptureParams {
    position?: number;
    crop?: string;
    rotate?: number;
}

const initialState: IState = {type: null, value: 0, rotateDegree: 0, scale: 1};

export class VideoEditorThumbnail extends React.Component<IProps, IState> {
    private ref: React.RefObject<HTMLCanvasElement>;
    private maxCanvasSize: { width: number; height: number };
    private interval: number;

    constructor(props: IProps) {
        super(props);

        this.state = initialState;
        this.ref = React.createRef();
        this.maxCanvasSize = {width: 0, height: 0};
        this.interval = 0;

        this.handleClick = this.handleClick.bind(this);
        this.handleUpload = this.handleUpload.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.getWrapperSize = this.getWrapperSize.bind(this);
    }

    componentDidMount() {
        const thumbnail = this.props.article.renditions?.viewImage?.href;

        if (thumbnail) {
            this.setThumbnail(thumbnail);
        }
    }

    componentDidUpdate(prevProps: IProps) {
        // video has changed so captured thumbnail showed on UI is no longer correct
        if (prevProps.article.renditions !== this.props.article.renditions && this.state.type === 'capture') {
            this.handleReset();
        }
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    handleClick() {
        this.setState(
            {
                type: 'capture',
                value: this.props.video.currentTime,
                rotateDegree: this.props.rotate,
            },
            () => {
                // make sure rotateDegree is updated so we can calculate scale ratio correctly
                const video = this.props.video;

                let {x, y, width, height, aspect} = this.props.getCropRotate(this.props.crop);

                aspect = aspect ?? 1;
                let canvasSize = [this.maxCanvasSize.width, this.maxCanvasSize.height];
                // crop is disabled or has not drew crop area yet
                const isDisabledCrop = [x, y, width, height].every((value) => value === 0);

                if (isDisabledCrop) {
                    aspect = video.videoWidth / video.videoHeight;
                }

                if (this.state.rotateDegree % 180 !== 0) {
                    if (!isDisabledCrop) {
                        aspect = 1 / aspect;
                    }
                    // make thumbnail overflow then scale it down, otherwise thumbnail will be too small
                    // once rotated because we draw thumbnail based on canvas width
                    canvasSize = [this.maxCanvasSize.height, this.maxCanvasSize.width];
                }

                this.drawCanvas(
                    video,
                    x || 0,
                    y || 0,
                    width || video.videoWidth,
                    height || video.videoHeight,
                    aspect,
                    canvasSize,
                );
            },
        );
    }

    handleUpload(files: FileList | null) {
        const file = files?.[0];

        if (file == null) {
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                this.setThumbnail(reader.result);
            }
        };

        reader.readAsDataURL(file);
        this.setState({...initialState, value: file, type: 'upload'});
    }

    handleSave() {
        const {gettext} = this.props.superdesk.localization;
        const {session, instance} = this.props.superdesk;
        const host = instance.config.server.url;

        if (this.state.type === 'capture' && typeof this.state.value === 'number') {
            const crop = this.props.getCropRotate(pick(this.props.crop, ['x', 'y', 'width', 'height']));
            const body: IThumbnailCaptureParams = {
                // Captured thumbnail from server and from canvas have small difference in time (position)
                position: this.state.value - 0.04,
                crop: Object.values(crop).join(','),
                rotate: this.state.rotateDegree,
            };

            if (body.crop === '0,0,0,0') {
                delete body.crop;
            }
            if (body.rotate === 0) {
                delete body.rotate;
            }
            // dataApi.create requires both body and response is the same type
            fetch(`${host}/video_edit`, {
                method: 'POST',
                headers: {
                    Authorization: session.getToken(),
                    'Content-Type': 'application/json',
                    'If-Match': this.props.article._etag,
                },
                body: JSON.stringify({
                    capture: body,
                    item: {
                        _id: this.props.article._id,
                        renditions: this.props.article.renditions,
                    },
                }),
            })
                .then(() => {
                    // reuse thumbnail from canvas so we don't have to display the old one,
                    // new thumbnail will be loaded when user reset changes
                    this.setState({
                        ...initialState,
                        scale: this.state.scale,
                        rotateDegree: this.props.rotate,
                    });
                    this.props.onToggleLoading(true, gettext('Saving capture thumbnail...'), 'thumbnail');
                    this.getThumbnail();
                })
                .catch(this.props.onError);
        } else if (this.state.type === 'upload' && this.state.value instanceof File) {
            const form = new FormData();

            form.append('file', this.state.value);

            fetch(`${host}/video_edit/${this.props.article._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: session.getToken(),
                    'If-Match': this.props.article._etag,
                },
                body: form,
            })
                .then((res) => res.json())
                .then((res: IVideoProject) => {
                    this.handleReset();
                    this.props.onSave(res.renditions, res._etag);
                    this.setThumbnail(res.renditions?.viewImage?.href ?? '');
                })
                .catch(this.props.onError);
        }
    }

    handleReset() {
        this.clearCanvas();
        this.setState({
            ...initialState,
            scale: this.state.scale,
        });
    }

    setThumbnail(src: string) {
        const image = new Image();

        image.onload = () => {
            this.drawCanvas(image, 0, 0, image.width, image.height);
        };
        image.src = src;

        // file reader result
        if (src.startsWith('data:') === false) {
            // Firefox does not reload image even no-store cache-control header is set
            image.src = src + `?t=${Math.random()}`;
        }
    }

    getThumbnail() {
        const {dataApi} = this.props.superdesk;

        this.interval = window.setInterval(() => {
            dataApi
                .findOne<IVideoProject>('video_edit', this.props.article._id)
                .then((response: IVideoProject) => {
                    if (response.project?.processing?.thumbnail_preview === false) {
                        clearInterval(this.interval);
                        this.props.onSave(response.renditions, response._etag);
                        this.props.onToggleLoading(false, '', 'thumbnail');
                    }
                })
                .catch((_: IErrorMessage) => {
                    clearInterval(this.interval);
                });
        }, 1500);
    }

    drawCanvas(
        element: HTMLImageElement | HTMLVideoElement,
        x: number,
        y: number,
        width: number,
        height: number,
        ratio: number = width / height,
        canvasSize: Array<number> = [this.maxCanvasSize.width, this.maxCanvasSize.height],
    ) {
        if (this.ref.current == null) {
            throw new Error('Could not get current canvas');
        }
        let [drawWidth, drawHeight] = canvasSize;

        if (ratio > 1) {
            drawHeight = drawWidth / ratio;
        } else {
            drawWidth = drawHeight * ratio;
        }
        this.ref.current.width = drawWidth;
        this.ref.current.height = drawHeight;
        this.ref.current.getContext('2d')?.drawImage(element, x, y, width, height, 0, 0, drawWidth, drawHeight);
        this.setScale(this.ref.current);
    }

    clearCanvas() {
        const ctx = this.ref.current?.getContext('2d');

        if (this.ref.current == null || ctx == null) {
            throw new Error('Could not get current canvas');
        }
        ctx.clearRect(0, 0, this.ref.current.width, this.ref.current.height);
        const thumbnail = this.props.article.renditions?.viewImage?.href;

        if (thumbnail) {
            this.setThumbnail(thumbnail);
        }
    }

    // get wrapper size dynamically to use for calculating canvas size to fit content into
    getWrapperSize(element: HTMLDivElement) {
        if (element == null) {
            return;
        }
        const {width, height} = element.getBoundingClientRect();

        this.maxCanvasSize = {
            width: width,
            height: height,
        };
    }

    setScale(ref: HTMLCanvasElement) {
        // calculate scale while rotating to make sure image is not exceeded maximum wrapper size
        let scale = 1;
        const height = ref.getBoundingClientRect().height / this.state.scale;

        if (height > this.maxCanvasSize.height) {
            scale = this.maxCanvasSize.height / height;
        } else if (height === this.maxCanvasSize.height && this.state.scale < 1) {
            // scale was calculated on previous call
            return;
        }
        this.setState({scale: scale});
    }

    render() {
        const {getClass} = this.props.superdesk.utilities.CSS;
        const {gettext} = this.props.superdesk.localization;

        return (
            <div className={`sd-photo-preview__thumbnail-edit ${getClass('thumbnail__container')}`}>
                <div className="sd-photo-preview__thumbnail-edit-label">{gettext('Video thumbnail')}</div>
                <div className="image-overlay">
                    <div className="image-overlay__button-block">
                        {this.state.type === null ? (
                            <>
                                <a
                                    className="image-overlay__button"
                                    sd-tooltip={gettext('Use current frame')}
                                    onClick={this.handleClick}
                                >
                                    <i className="icon-photo" />
                                </a>
                                <form className="sd-margin-start--1">
                                    <label>
                                        <input
                                            type="file"
                                            style={{display: 'none'}}
                                            accept=".png,.jpg,.jpeg,.webp"
                                            onChange={(e) => this.handleUpload(e.target.files)}
                                        />
                                        <a className="image-overlay__button" sd-tooltip={gettext('Upload image')}>
                                            <i className="icon-upload" />
                                        </a>
                                    </label>
                                </form>
                            </>
                        ) : (
                            <>
                                <a
                                    className="image-overlay__button"
                                    sd-tooltip={gettext('Save change')}
                                    onClick={this.handleSave}
                                >
                                    <i className="icon-ok" />
                                </a>
                                <a
                                    className="image-overlay__button"
                                    sd-tooltip={gettext('Reset change')}
                                    onClick={this.handleReset}
                                >
                                    <i className="icon-close-thick" />
                                </a>
                            </>
                        )}
                    </div>
                </div>
                {!this.props.article.renditions?.viewImage?.href && !this.state.value && (
                    <div className={getClass('thumbnail--empty')}>
                        <div className="upload__info-icon" />
                        <p className={getClass('thumbnail--empty__text')}>{gettext('No thumbnail')}</p>
                    </div>
                )}
                <div className={getClass('thumbnail__wrapper')} ref={this.getWrapperSize}>
                    <canvas
                        ref={this.ref}
                        style={{transform: `rotate(${this.state.rotateDegree}deg) scale(${this.state.scale})`}}
                    />
                </div>
            </div>
        );
    }
}
