import * as React from 'react';
import {IThumbnail} from '../interfaces';

interface IProps {
    thumbnails: Array<IThumbnail>;
    thumbnailWidth: number;
    totalThumbnails: number;
    getClass: (className: string) => string;
}

export class ListThumbnails extends React.PureComponent<IProps> {
    render() {
        const getClass = this.props.getClass;
        const width = this.props.thumbnailWidth * this.props.totalThumbnails;

        return (
            <div
                className={`
                    ${getClass('timeline__thumbnails')}
                    ${this.props.thumbnails.length === 0 ? getClass('timeline__thumbnails--loading') : ''}
                `}
                style={{minWidth: width + 'px'}}
            >
                {this.props.thumbnails.map((item: IThumbnail, index: number) => (
                    <img src={item.url + `?t=${Math.random()}`} width={item.width} height={item.height} key={index} />
                ))}
            </div>
        );
    }
}
