import React from 'react';
import {IArticle} from 'superdesk-api';
import {HLSVideoComponent} from './video-hls';
import {isEqual} from 'lodash';

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
export class VideoComponent extends React.Component<IProps> {
    videoElement: HTMLVideoElement;

    shouldComponentUpdate(nextProps: IProps) {
        return !isEqual(
            {renditions: this.props.item.renditions, guid: this.props.item.guid},
            {renditions: nextProps.item.renditions, guid: nextProps.item.guid},
        );
    }

    componentDidUpdate() {
        this.videoElement?.load();
    }

    render() {
        const renditions = this.props.item.renditions;
        const guid = this.props.item.guid;

        if (renditions == null) {
            return null;
        }

        const poster = renditions?.thumbnail?.href;
        const videoRenditions: Array<IVideoRenditionItem> = [];

        for (const rend of Object.values(renditions)) {
            if (rend == null || rend.mimetype == null) {
                continue;
            } else if (rend.mimetype.toLowerCase() === 'application/x-mpegurl') {
                // HLSVideoComponent can handle only one stream url
                return (
                    <HLSVideoComponent
                        poster={poster}
                        streamUrl={rend.href}
                        key={rend.href}
                        width={this.props.width}
                        height={this.props.height}
                    />
                );
            } else if (rend.mimetype.startsWith('video')) {
                videoRenditions.push(rend);
            }
        }

        return (
            // using key to force reload video on selecting different item for preview
            <video
                key={guid}
                controls
                preload="metadata"
                poster={poster}
                width={this.props.width}
                height={this.props.height}
                ref={(el) => {
                    this.videoElement = el;
                }}
            >
                {videoRenditions.map((rendition) => (
                    <source key={rendition.href} src={rendition.href} type={rendition.mimetype} />
                ))}
            </video>
        );
    }
}
