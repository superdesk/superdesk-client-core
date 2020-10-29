import React from 'react';
import {VideoComponent} from 'core/ui/components/video';
import {IArticle} from 'superdesk-api';

interface IProps {
    mediaItems: Array<IArticle>;
}

export class MediaPreview extends React.Component<IProps> {
    render() {
        return (
            <div>
                {this.props.mediaItems.map((item) => (
                    <div key={item._id}>
                        {(() => {
                            if (item.type === 'picture') {
                                return (
                                    <img src={item.renditions.viewImage.href} />
                                );
                            } else if (item.type === 'video') {
                                return (
                                    <VideoComponent item={item} />
                                );
                            } else if (item.type === 'audio') {
                                return (
                                    <audio controls>
                                        {
                                            Object.values(item.renditions).map(({href}) => (
                                                <source key={href} src={href}></source>
                                            ))
                                        }
                                    </audio>
                                );
                            }
                        })()}
                        {
                            item.description_text?.trim().length < 1 ? null : (
                                <div>{item.description_text}</div>
                            )
                        }
                    </div>
                ))}
            </div>
        );
    }
}
