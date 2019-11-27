import React from 'react';
import {IArticle} from 'superdesk-api';
import {HLSVideoComponent} from './video-hls';

interface IProps {
    item: IArticle;
}

interface IVideoRenditionItem {
    mimetype: string;
    href: string;
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

        let videoRenditions: Array<IVideoRenditionItem> = [];

        for (const rend of Object.values(item.renditions)) {
            if (rend.mimetype == null) {
                continue;
            } else if (rend.mimetype.toLowerCase() === 'application/x-mpegurl') {
                return <HLSVideoComponent poster={poster} streamUrl={rend.href} key={rend.href}/>;
            } else if (rend.mimetype.startsWith('video')) {
                videoRenditions.push(rend);
            }
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
