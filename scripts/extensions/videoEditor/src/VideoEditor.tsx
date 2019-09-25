import * as React from 'react';
import { IArticle } from 'superdesk-api';
import { get } from 'lodash';

interface IArticleVideo extends IArticle {
    renditions?: {
        original: {
            hef: string;
            media: string;
            mimetype: string;
            version: number;
        };
    };
}

type IVideoEditorProps = {
    article: IArticleVideo;
};
type IVideoEditorState = {
    degree: number;
    playing: boolean;
};

export class VideoEditor extends React.Component<IVideoEditorProps, IVideoEditorState> {
    private ref: React.RefObject<HTMLVideoElement>;
    constructor(props: IVideoEditorProps) {
        super(props);
        this.ref = React.createRef();
        this.state = {
            degree: 0,
            playing: false,
        };
    }

    rotate = () => {
        this.setState(
            prevState => ({ degree: prevState.degree - 90 }),
            () => {
                if (this.state.degree % 360 === 0) {
                    this.setState({ degree: 0 });
                }
            }
        );
    };

    toggleVideo = () => {
        if (this.state.playing) {
            this.ref.current!.pause();
        } else {
            this.ref.current!.play();
        }
    };

    render() {
        const videoSrc = get(this.props.article.renditions, 'original.href');
        const degree = this.state.degree + 'deg';
        return (
            <div>
                <div className="sd-photo-preview sd-photo-preview--edit-video">
                    <div className="sd-photo-preview__video">
                        <div className="sd-photo-preview__video-inner">
                            <div className="sd-photo-preview__video-container">
                                <video
                                    ref={this.ref}
                                    src={videoSrc}
                                    style={{ transform: `rotate(${degree})` }}
                                    onPlay={() => this.setState({ playing: true })}
                                    onPause={() => this.setState({ playing: false })}
                                    autoPlay
                                ></video>
                            </div>
                            <div className="sd-photo-preview__video-tools">
                                <a
                                    className="btn btn--ui-dark btn--icon-only btn-hollow"
                                    onClick={() => {
                                        this.toggleVideo();
                                    }}
                                >
                                    <i className={this.state.playing ? 'icon-pause' : 'icon-play'}></i>
                                </a>
                                <a className="btn btn--ui-dark btn--icon-only btn-hollow" onClick={() => this.rotate()}>
                                    <i className="icon-rotate-left"></i>
                                </a>
                                <a className="btn btn--ui-dark btn--icon-only btn-hollow">
                                    <i className="icon-crop"></i>
                                </a>
                                <span className="sd-photo-preview__label mlr-auto">{this.props.article.headline}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
