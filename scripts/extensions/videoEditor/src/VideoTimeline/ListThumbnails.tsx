import * as React from 'react';
import VideoEditorContext from '../VideoEditorContext';
import {IThumbnail} from '../interfaces';

interface IProps {
    thumbnails: Array<IThumbnail>;
}

export class ListThumbnails extends React.PureComponent<IProps> {
    static contextType = VideoEditorContext;

    render() {
        const {getClass} = this.context.superdesk.utilities.CSS;

        return (
            <div className={`${getClass('frames')} ${getClass('frames--thumbs')}`}>
                <div className={getClass('frames__inner')}>
                    {this.props.thumbnails.map((item: IThumbnail, index: number) => (
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
