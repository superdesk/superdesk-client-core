import React from 'react';
import {IArticle} from 'superdesk-api';
import {HLSVideoComponent} from './video-hls';

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
            .filter(
                (rend) => rend.mimetype != null && (rend.mimetype.startsWith('video') || rend.mimetype.startsWith('application/x-mpegurl')),
            );

        if (videoRenditions.length > 0 && videoRenditions[0].mimetype === 'application/x-mpegurl') {
            return <HLSVideoComponent
                poster={poster}
                streamUrl={videoRenditions[0].href}
                key={videoRenditions[0].href}
            />;
        }

        return (
            <video controls preload="metadata" poster={poster}>
                {videoRenditions.map((rendition) => (
                    <source key={rendition.href} src={rendition.href} type={rendition.mimetype}/>
                ))}
            </video>
        );
    }
}
