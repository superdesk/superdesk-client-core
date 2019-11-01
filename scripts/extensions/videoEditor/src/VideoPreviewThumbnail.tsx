import * as React from 'react';
import { ISuperdesk } from 'superdesk-api';
import VideoEditorContext from './VideoEditorContext';
import { IArticleVideo, IVideoEditor } from './interfaces';
import { get, pick } from 'lodash';

interface IProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    article: IArticleVideo;
    crop: IVideoEditor['crop'];
    rotate: IVideoEditor['degree'];
    onToggleLoading: (isLoading: boolean) => void;
    getCropRotate: (crop: IVideoEditor['crop']) => IVideoEditor['crop'];
}

interface IState {
    dirty: boolean;
    type: 'capture' | 'upload' | '';
    value: number | File; // capture positon or uploaded File
    // most recent changed preview thumbnail, for re-drawing thumbnail when reset changes
    thumbnail: string;
    // deprived from props to save rotate degree only when user captures thumbnail
    rotateDegree: number;
    scale: number;
}

export class VideoPreviewThumbnail extends React.Component<IProps, IState> {
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
            thumbnail: get(this.props.article.renditions, 'thumbnail.href'),
            rotateDegree: 0,
            scale: 1,
        };
        this.ref = React.createRef();
        this.maxCanvasSize = { width: 0, height: 0 };
        this.interval = 0;
    }

    componentDidMount() {
        if (this.state.thumbnail) {
            this.setPreviewThumbnail(this.state.thumbnail + `?t=${Math.random()}`);
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
            this.setScale
        );
        const video = this.props.videoRef.current;
        if (!video) return;
        let { x, y, width, height, aspect } = this.props.getCropRotate(this.props.crop);

        let canvasSize = [this.maxCanvasSize.width, this.maxCanvasSize.height];
        if (this.props.rotate % 180 !== 0) {
            if (aspect !== 1 && (width !== 0 || height !== 0)) {
                aspect = 1 / aspect!;
                canvasSize = [this.maxCanvasSize.height, this.maxCanvasSize.width];
            }
        }

        this.drawCanvas(
            video,
            x || 0,
            y || 0,
            width || video.videoWidth,
            height || video.videoHeight,
            aspect || video.videoWidth / video.videoHeight,
            canvasSize
        );
        this.setState({ dirty: true });
    };

    handleChange = (files: FileList | null) => {
        const reader = new FileReader();
        reader.onload = () => this.setPreviewThumbnail(reader.result as string);
        const file = files ? files[0] : null;
        reader.readAsDataURL(file!);
        this.setState({ dirty: true, value: file!, type: 'upload' });
    };

    handleSave = () => {
        const { dataApi } = this.context.superdesk;
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
                    this.setState({ rotateDegree: this.props.rotate });
                    this.props.onToggleLoading(true);
                    this.getPreviewThumbnail();
                })
                .catch((err: any) => console.log(err));
        } else if (this.state.type === 'upload') {
            const form = new FormData();
            form.append('file', this.state.value as File);

            const { session, instance }: ISuperdesk = this.context.superdesk;
            const host = instance.config.server.url;
            fetch(`${host}/video_edit/${this.props.article._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: session.getToken(),
                    'If-Match': this.props.article._etag,
                },
                body: form,
            })
                .then(res => res.json())
                .then((res: any) => {
                    this.handleReset();
                    this.setPreviewThumbnail(res.renditions.thumbnail.href + `?t=${Math.random()}`);
                });
        }
    };

    setPreviewThumbnail = (src: string) => {
        const image = new Image();
        image.onload = () => {
            this.drawCanvas(image, 0, 0, image.width, image.height);
        };
        image.src = src;
    };

    getPreviewThumbnail = () => {
        const { dataApi } = this.context.superdesk;
        this.interval = window.setInterval(() => {
            dataApi
                .findOne('video_edit', this.props.article._id + `?t=${Math.random()}`) // avoid caching response
                .then((response: any) => {
                    if (response.project.processing.thumbnail_preview === false) {
                        clearInterval(this.interval);
                        this.setState({ thumbnail: response.renditions.thumbnail.href });
                        this.props.onToggleLoading(false);
                    }
                })
                .catch((_: any) => {
                    clearInterval(this.interval);
                });
        }, 1500);
    };

    handleReset = (clearCanvas: boolean = true) => {
        const ctx = this.ref.current!.getContext('2d');
        if (clearCanvas === true) {
            ctx!.clearRect(0, 0, this.ref.current!.width, this.ref.current!.height);

            if (this.state.thumbnail) {
                this.setPreviewThumbnail(this.state.thumbnail + `?t=${Math.random()}`);
            }
        }
        this.setState({ dirty: false, type: '', value: 0, rotateDegree: 0, scale: 1 });
    };

    drawCanvas = (
        element: HTMLImageElement | HTMLVideoElement,
        x: number,
        y: number,
        width: number,
        height: number,
        ratio: number = width / height,
        canvasSize: number[] = [this.maxCanvasSize.width, this.maxCanvasSize.height]
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
    };

    // get wrapper size dynamically so can use to calculate canvas size to fit content into
    getWrapperSize = (element: any) => {
        const { width, height } = element.getBoundingClientRect();
        this.maxCanvasSize = {
            width: width,
            height: height,
        };
    };

    setScale = () => {
        let scale = 1;
        // calculate scale while rotating to make sure image is not exceeded maximum wrapper size,
        if (this.ref.current! && this.state.rotateDegree % 180 !== 0) {
            // scale is calculated on previous call
            if (this.state.scale !== 1) {
                return;
            }
            const { width, height } = this.ref.current!.getBoundingClientRect();
            const ratio = width / height;

            if (ratio >= 1 && width > this.maxCanvasSize.width) {
                scale = this.maxCanvasSize.height / width;
            } else if (ratio < 1 && height > this.maxCanvasSize.height) {
                scale = this.maxCanvasSize.height / height;
            }
        }
        this.setState({ scale: scale });
    };

    render() {
        const { getClass } = this.context.superdesk.utilities.CSS;

        return (
            <div className="sd-photo-preview__thumbnail-edit">
                <div className={getClass('thumbnail-edit__preview')} ref={this.getWrapperSize}>
                    <canvas
                        ref={this.ref}
                        className={getClass('thumbnail-edit__preview-canvas')}
                        style={{ transform: `rotate(${this.state.rotateDegree}deg) scale(${this.state.scale})` }}
                    ></canvas>
                </div>
                <div className={getClass('thumbnail-edit__container')}>
                    {!this.state.dirty ? (
                        <>
                            <button
                                className="btn btn--icon-only-circle btn--large btn--hollow sd-margin-r--1"
                                onClick={this.handleClick}
                            >
                                <i className="icon-photo icon--white"></i>
                            </button>
                            <form>
                                <label className="btn btn--icon-only-circle btn--large btn--hollow">
                                    <input
                                        type="file"
                                        style={{ display: 'none' }}
                                        accept=".png,.jpg,.jpeg,.webp"
                                        onChange={e => this.handleChange(e.target.files)}
                                    />
                                    <i className="icon-upload icon--white"></i>
                                </label>
                            </form>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn--icon-only-circle btn--large btn--primary sd-margin-r--1"
                                onClick={this.handleSave}
                            >
                                <i className="icon-ok icon--white"></i>
                            </button>
                            <button
                                className="btn btn--icon-only-circle btn--large btn--hollow"
                                onClick={() => this.handleReset()}
                            >
                                <i className="icon-close-thick icon--white"></i>
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }
}
