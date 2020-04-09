import React from 'react';
import {IArticle} from 'superdesk-api';
import {HLSVideoComponent} from './video-hls';

interface IProps {
    item: IArticle;
    width?: string;
    height?: string;
}

interface IVideoRenditionItem {
    mimetype: string;
    href: string;
}

/**
 * VideoComponent is used to render a player for an item with type video.
 */
export class VideoComponent extends React.PureComponent<IProps> {
    render() {
        const {item} = this.props;
        const poster = item.renditions?.thumbnail?.href;
        const videoRenditions: Array<IVideoRenditionItem> = [];

        if (item.renditions == null) {
            return null;
        }

        for (const rend of Object.values(item.renditions)) {
            if (rend == null || rend.mimetype == null) {
                continue;
            } else if (rend.mimetype.toLowerCase() === 'application/x-mpegurl') {
                // HLSVideoComponent can handle only one stream url
                return <HLSVideoComponent
                    poster={poster}
                    streamUrl={rend.href}
                    key={rend.href}
                    width={this.props.width}
                    height={this.props.height}
                />;
            } else if (rend.mimetype.startsWith('video')) {
                videoRenditions.push(rend);
            }
        }

        return (
            // using key to force reload video on selecting different item for preview
            <video key={item.guid}
                controls
                preload="metadata"
                poster={poster}
                width={this.props.width}
                height={this.props.height}>
                {videoRenditions.map((rendition) => (
                    <source key={rendition.href} src={rendition.href} type={rendition.mimetype}/>
                ))}
            </video>
        );
    }
}
