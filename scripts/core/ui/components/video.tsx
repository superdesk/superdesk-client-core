import React from 'react';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
}

export class VideoComponent extends React.PureComponent<IProps> {
    render() {
        const {item} = this.props;
        let poster = null;

        if (item.renditions == null) {
            return null;
        }

        if (item.renditions.viewImage != null) {
            poster = item.renditions.viewImage.href;
        }

        const videoRenditions = Object.values(item.renditions)
            .filter((rendition) => rendition.mimetype != null && rendition.mimetype.startsWith('video'));

        return (
            <video controls preload="metadata" poster={poster}>
                {videoRenditions.map((rendition) => (
                    <source key={rendition.href} src={rendition.href} type={rendition.mimetype} />
                ))}
            </video>
        );
    }
}
