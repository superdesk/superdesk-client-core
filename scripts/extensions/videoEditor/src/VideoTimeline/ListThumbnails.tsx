import * as React from 'react';
import VideoEditorContext from '../VideoEditorContext';
import { ThumbnailObject } from '../VideoEditor';

interface IProps {
    thumbnails: Array<ThumbnailObject>;
    video: React.RefObject<HTMLVideoElement>;
}

export class ListThumbnails extends React.Component<IProps> {
    static contextType = VideoEditorContext;

    constructor(props: IProps) {
        super(props);
    }
    render() {
        const { getClass } = this.context;
        return (
            <div className={`${getClass('frames')} ${getClass('frames--thumbs')}`}>
                <div className={getClass('frames__inner')}>
                    {this.props.thumbnails.map((item: ThumbnailObject, index: number) => (
                        <video
                            className={`${getClass('frames__video')} ${item.url && getClass('frames__video--loaded')}`}
                            poster={item.url}
                            width={item.width}
                            height={item.height}
                            key={index}
                        />
                    ))}
                </div>
            </div>
        );
    }
}
