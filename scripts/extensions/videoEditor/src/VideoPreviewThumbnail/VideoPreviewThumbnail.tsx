import * as React from 'react';
import VideoEditorContext from '../VideoEditorContext';
import { IArticleVideo } from '../interfaces';
import { get } from 'lodash';

interface IProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    article: IArticleVideo;
    onToggleLoading: (isLoading: boolean) => void;
}

interface IState {
    dirty: boolean;
    type: 'capture' | 'upload' | '';
    value: number | File; // capture positon or uploaded File
    // most recent changed preview thumbnail, for re-drawing thumbnail when reset changes
    thumbnail: string;
}

export class VideoPreviewThumbnail extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    private ref: React.RefObject<HTMLCanvasElement>;
    private size: number;
    private interval: any;

    constructor(props: IProps) {
        super(props);
        this.state = {
            dirty: false,
            type: '',
            value: 0,
            thumbnail: get(this.props.article.renditions, 'thumbnail.href'),
        };
        this.ref = React.createRef();
        this.size = 160; // max size of element
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
        this.setState({ dirty: true, type: 'capture', value: this.props.videoRef.current!.currentTime });
        const video = this.props.videoRef.current;
        if (!video) return;

        this.drawCanvas(video, video.videoWidth, video.videoHeight);
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
            dataApi
                .create('video_edit', {
                    // Captured thumbnail from server and from canvas have small difference
                    // in time (position)
                    capture: { type: 'capture', position: (this.state.value as number) - 0.04 },
                    item: this.props.article,
                })
                .then((_: any) => {
                    // reuse thumbnail from canvas so we don't have to display old one,
                    // new thumbnail will be loaded when user reset changes
                    this.handleReset(false);
                    this.props.onToggleLoading(true);
                    this.getPreviewThumbnail();
                })
                .catch((err: any) => console.log(err));
        } else if (this.state.type === 'upload') {
        }
    };

    setPreviewThumbnail = (src: string) => {
        const image = new Image();
        image.onload = () => {
            this.drawCanvas(image, image.width, image.height);
        };
        image.src = src;
    };

    getPreviewThumbnail = () => {
        const { dataApi } = this.context.superdesk;
        this.interval = setInterval(() => {
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
        this.setState({ dirty: false, type: '', value: 0 });
    };

    drawCanvas = (element: any, width: number, height: number) => {
        const ctx = this.ref.current!.getContext('2d');
        const ratio = width / height;
        let [drawWidth, drawHeight] = [this.size, this.size];
        if (ratio > 1) {
            drawHeight = this.size / ratio;
        } else {
            drawWidth = this.size * ratio;
        }
        this.ref.current!.width = drawWidth;
        this.ref.current!.height = drawHeight;
        ctx!.drawImage(element, 0, 0, drawWidth, drawHeight);
    };

    render() {
        const { getClass } = this.context.superdesk.utilities.CSS;
        return (
            <div className="sd-photo-preview__thumbnail-edit">
                <div className={getClass('thumbnail-edit__preview')}>
                    <canvas ref={this.ref} className={getClass('thumbnail-edit__preview-canvas')}></canvas>
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
