import * as React from 'react';
import VideoEditorContext from '../VideoEditorContext';

interface IProps {
    thumbnails: Array<ThumbnailObject>;
    widthPic: number;
    numberThumbnails: number;
    video: React.RefObject<HTMLVideoElement>;
}

interface IState {
    thumbnailsRender: Array<ThumbnailObject>;
}

type ThumbnailObject = {
    url: string;
};

export class ListThumbnails extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;

    constructor(props: IProps) {
        super(props);
        this.state = {
            thumbnailsRender: [],
        };
    }
    componentDidMount() {
        const duration = this.props.video.current! ? this.props.video.current!.duration : 0;
        let thumbnailsRender: Array<ThumbnailObject> = [];
        const per_delta_image =
            this.props.thumbnails.length > 1
                ? (this.props.thumbnails.length - 1) / this.props.numberThumbnails
                : duration / this.props.numberThumbnails;
        for (let i = 0; i <= this.props.numberThumbnails; i++) {
            let thumnail: ThumbnailObject;
            if (this.props.thumbnails && this.props.thumbnails.length > 0) {
                thumnail = this.props.thumbnails[Math.round(i * per_delta_image)];
                thumbnailsRender.push(thumnail);
            } else {
                thumnail = {
                    url: '',
                };
                thumbnailsRender.push(thumnail);
                //Loading thumbnail one by one, if we call all api at same time, browser will lag.
            }
        }
        this.setState({
            thumbnailsRender: thumbnailsRender,
        });
    }

    render() {
        const { getClass } = this.context;
        return (
            <div className={`${getClass('frames')} ${getClass('frames--thumbs')}`}>
                <div className={getClass('frames__inner')}>
                    {this.state.thumbnailsRender.map((item: ThumbnailObject, index: number) => (
                        <video
                            className={`${getClass('frames__video')} ${item.url && getClass('frames__video--loaded')}`}
                            poster={item.url}
                            width={this.props.widthPic}
                            height="50"
                            key={index}
                        />
                    ))}
                </div>
            </div>
        );
    }
}
