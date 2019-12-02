import React from 'react';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    width?: string;
    height?: string;
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
            // using key to force reload video on selecting different item for preview
            <video key={item.guid}
                controls
                preload="metadata"
                poster={poster}
                width={this.props.width}
                height={this.props.height}>
                {videoRenditions.map((rendition) => (
                    <source key={rendition.href} src={rendition.href} type={rendition.mimetype} />
                ))}
            </video>
        );
    }
}
