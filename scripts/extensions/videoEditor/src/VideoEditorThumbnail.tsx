import * as React from 'react';
import {ISuperdesk} from 'superdesk-api';
import VideoEditorContext from './VideoEditorContext';
import {IArticleVideo, IVideoEditor} from './interfaces';
import {pick} from 'lodash';

interface IProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    article: IArticleVideo;
    crop: IVideoEditor['crop'];
    rotate: IVideoEditor['degree'];
    onToggleLoading: (isLoading: boolean, loadingText?: string) => void;
    onSave: (article: IArticleVideo) => void;
    onError: (err: any) => void;
    getCropRotate: (crop: IVideoEditor['crop']) => IVideoEditor['crop'];
}

interface IState {
    dirty: boolean;
    type: 'capture' | 'upload' | '';
    value: number | File; // capture positon or uploaded File
    // most recent updated thumbnail, for re-drawing thumbnail when reset changes
    thumbnail: string;
    // save current rotate degree when user captures thumbnail
    rotateDegree: number;
    scale: number;
}

export class VideoEditorThumbnail extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    private ref: React.RefObject<HTMLCanvasElement>;
    private maxCanvasSize: { width: number; height: number };
    private interval: number;

    constructor(props: IProps) {
        super(props);
        this.state = {
            dirty: false,
            type: '',
            value: 0,
            thumbnail: this.props.article.renditions?.thumbnail!?.href,
            rotateDegree: 0,
            scale: 1,
        };
        this.ref = React.createRef();
        this.maxCanvasSize = {width: 0, height: 0};
        this.interval = 0;
    }

    componentDidMount() {
        if (this.state.thumbnail) {
            const thumbnail = this.state.thumbnail + `?t=${Math.random()}`;

            this.setState({thumbnail: thumbnail});
            this.setThumbnail(thumbnail);
        }
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    handleClick = () => {
        this.setState(
            {
                dirty: true,
                type: 'capture',
                value: this.props.videoRef.current!.currentTime,
                rotateDegree: this.props.rotate,
            },
            () => {
                // make sure rotateDegree is updated so we can calculate scale ratio correctly
                const video = this.props.videoRef.current;

                if (!video) {
                    return;
                }
                let {x, y, width, height, aspect} = this.props.getCropRotate(this.props.crop);

                let canvasSize = [this.maxCanvasSize.width, this.maxCanvasSize.height];
                // crop is disabled or has not drew crop zone yet
                const isDisabledCrop = [x, y, width, height].every((value) => value === 0);

                if (isDisabledCrop) {
                    aspect = video.videoWidth / video.videoHeight;
                }

                if (this.state.rotateDegree % 180 !== 0) {
                    if (!isDisabledCrop) {
                        aspect = 1 / aspect!;
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
                this.setState({dirty: true});
            },
        );
    }

    handleChange = (files: FileList | null) => {
        const reader = new FileReader();

        reader.onload = () => this.setThumbnail(reader.result as string);
        const file = files ? files[0] : null;

        reader.readAsDataURL(file!);
        this.setState({dirty: true, value: file!, type: 'upload'});
    }

    handleSave = () => {
        const {dataApi} = this.context.superdesk;

        if (this.state.type === 'capture') {
            const crop = this.props.getCropRotate(pick(this.props.crop, ['x', 'y', 'width', 'height']));
            const body = {
                // Captured thumbnail from server and from canvas have small difference in time (position)
                position: (this.state.value as number) - 0.04,
                crop: Object.values(crop).join(','),
                rotate: this.state.rotateDegree,
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
                .then((_: any) => {
                    // reuse thumbnail from canvas so we don't have to display old one,
                    // new thumbnail will be loaded when user reset changes
                    this.handleReset(false);
                    this.setState({rotateDegree: this.props.rotate});
                    this.props.onToggleLoading(true, 'Saving capture thumbnail...');
                    this.getThumbnail();
                })
                .catch(this.props.onError);
        } else if (this.state.type === 'upload') {
            const form = new FormData();

            form.append('file', this.state.value as File);

            const {session, instance}: ISuperdesk = this.context.superdesk;
            const host = instance.config.server.url;

            fetch(`${host}/video_edit/${this.props.article._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: session.getToken(),
                    'If-Match': this.props.article._etag,
                },
                body: form,
            })
                .then((res) => res.json())
                .then((res: any) => {
                    this.handleReset();
                    this.props.onSave(res);
                    const url = res.renditions.thumbnail.href + `?t=${Math.random()}`;

                    this.setState({thumbnail: url});
                    this.setThumbnail(url);
                });
        }
    }

    setThumbnail = (src: string) => {
        const image = new Image();

        image.onload = () => {
            this.drawCanvas(image, 0, 0, image.width, image.height);
        };
        image.src = src;
    }

    getThumbnail = () => {
        const {dataApi} = this.context.superdesk;

        this.interval = window.setInterval(() => {
            dataApi
                .findOne('video_edit', this.props.article._id + `?t=${Math.random()}`) // avoid caching response
                .then((response: any) => {
                    if (response.project.processing.thumbnail_preview === false) {
                        clearInterval(this.interval);
                        this.setState({thumbnail: response.renditions.thumbnail.href + `?t=${Math.random()}`});
                        this.props.onSave(response);
                        this.props.onToggleLoading(false);
                    }
                })
                .catch((_: any) => {
                    clearInterval(this.interval);
                });
        }, 1500);
    }

    handleReset = (clearCanvas: boolean = true) => {
        let scale = this.state.scale;
        const ctx = this.ref.current!.getContext('2d');

        if (clearCanvas === true) {
            ctx!.clearRect(0, 0, this.ref.current!.width, this.ref.current!.height);
            scale = 1;

            if (this.state.thumbnail) {
                this.setThumbnail(this.state.thumbnail);
            }
        }
        this.setState({dirty: false, type: '', value: 0, rotateDegree: 0, scale: scale});
    }

    drawCanvas = (
        element: HTMLImageElement | HTMLVideoElement,
        x: number,
        y: number,
        width: number,
        height: number,
        ratio: number = width / height,
        canvasSize: Array<number> = [this.maxCanvasSize.width, this.maxCanvasSize.height],
    ) => {
        const ctx = this.ref.current!.getContext('2d');

        let [drawWidth, drawHeight] = canvasSize;

        if (ratio > 1) {
            drawHeight = drawWidth / ratio;
        } else {
            drawWidth = drawHeight * ratio;
        }
        this.ref.current!.width = drawWidth;
        this.ref.current!.height = drawHeight;
        ctx!.drawImage(element, x, y, width, height, 0, 0, drawWidth, drawHeight);
        this.setScale();
    }

    // get wrapper size dynamically so can use to calculate canvas size to fit content into
    getWrapperSize = (element: any) => {
        if (element == null) {
            return;
        }

        const {width, height} = element.getBoundingClientRect();

        this.maxCanvasSize = {
            width: width,
            height: height,
        };
    }

    setScale = () => {
        // calculate scale while rotating to make sure image is not exceeded maximum wrapper size
        let scale = 1;

        if (!this.ref.current) {
            return;
        }

        const height = this.ref.current.getBoundingClientRect().height / this.state.scale;

        if (height > this.maxCanvasSize.height) {
            scale = this.maxCanvasSize.height / height;
        } else if (height === this.maxCanvasSize.height && this.state.scale < 1) {
            // scale was calculated on previous call
            return;
        }
        this.setState({scale: scale});
    }

    render() {
        const {getClass} = this.context.superdesk.utilities.CSS;
        const {gettext} = this.context.superdesk.localization;

        return (
            <div className={`sd-photo-preview__thumbnail-edit ${getClass('video__thumbnail__container')}`}>
                <div className="sd-photo-preview__thumbnail-edit-label">{gettext('Video thumbnail')}</div>
                <div className="image-overlay">
                    <div className="image-overlay__button-block">
                        {!this.state.dirty ? (
                            <>
                                <a
                                    className="image-overlay__button"
                                    sd-tooltip={gettext('Use current frame')}
                                    onClick={this.handleClick}
                                >
                                    <i className="icon-photo" />
                                </a>
                                <form className="sd-margin-l--1">
                                    <label>
                                        <input
                                            type="file"
                                            style={{display: 'none'}}
                                            accept=".png,.jpg,.jpeg,.webp"
                                            onChange={(e) => this.handleChange(e.target.files)}
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
                                    onClick={() => this.handleReset()}
                                >
                                    <i className="icon-close-thick" />
                                </a>
                            </>
                        )}
                    </div>
                </div>
                {!this.state.thumbnail && !this.state.value && (
                    <div className={getClass('video__thumbnail--empty')}>
                        <div className="upload__info-icon" />
                        <p className={getClass('video__thumbnail--empty__text')}>{gettext('No thumbnail')}</p>
                    </div>
                )}
                <div className={getClass('video__thumbnail__wrapper')} ref={this.getWrapperSize}>
                    <canvas
                        ref={this.ref}
                        style={{transform: `rotate(${this.state.rotateDegree}deg) scale(${this.state.scale})`}}
                    />
                </div>
            </div>
        );
    }
}
