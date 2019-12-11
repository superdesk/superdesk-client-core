import * as React from 'react';
import {IThumbnail} from '../interfaces';

interface IProps {
    thumbnails: Array<IThumbnail>;
    getClass: (className: string) => string;
}

export class ListThumbnails extends React.PureComponent<IProps> {
    render() {
        const getClass = this.props.getClass;

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
