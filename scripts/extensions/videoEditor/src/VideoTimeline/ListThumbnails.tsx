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
            <div
                className={`
                    ${getClass('timeline__thumbnails')}
                    ${this.props.thumbnails.length === 0 ? getClass('timeline__thumbnails--loading') : ''}
                `}
            >
                {this.props.thumbnails.map((item: IThumbnail, index: number) => (
                    <img src={item.url} width={item.width} height={item.height} key={index} />
                ))}
            </div>
        );
    }
}
