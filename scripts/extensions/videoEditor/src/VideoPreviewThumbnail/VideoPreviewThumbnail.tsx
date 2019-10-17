import * as React from 'react';
import VideoEditorContext from '../VideoEditorContext';
import { IArticleVideo } from '../interfaces';
import { get } from 'lodash';

interface IProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    article: IArticleVideo;
}

interface IState {
    dirty: boolean;
    type: 'capture' | 'upload' | '';
    value: File | number;
}

export class VideoPreviewThumbnail extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    private ref: React.RefObject<HTMLCanvasElement>;
    private size: number;

    constructor(props: IProps) {
        super(props);
        this.state = {
            dirty: false,
            type: '',
            value: 0,
        };
        this.ref = React.createRef();
        this.size = 160; // max size of element canvas
    }

    componentDidMount() {
        if (get(this.props.article.renditions, 'thumbnail.href')) {
            this.setPreviewThumbnail(this.props.article.renditions!.thumbnail.href + `?nocache=${Math.random()}`);
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
        reader.readAsDataURL(files![0]);
        this.setState({ dirty: true });
    };

    handleSave = () => {
        const { dataApi } = this.context.superdesk;
        if (this.state.type === 'capture') {
            dataApi
                .create('video_edit', {
                    capture: { type: 'capture', position: this.state.value },
                    item: this.props.article,
                })
                .then(response => {
                    this.handleCancel();
                    this.setPreviewThumbnail(response.item.renditions.thumbnail.href + `?nocache=${Math.random()}`);
                });
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

    handleCancel = () => {
        this.setState({ dirty: false, type: '', value: 0 });
        const ctx = this.ref.current!.getContext('2d');
        ctx!.clearRect(0, 0, this.ref.current!.width, this.ref.current!.height);
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
                                onClick={this.handleCancel}
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
