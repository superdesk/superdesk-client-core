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
                {this.props.mediaItems.map((item, index) => (
                    <div key={item._id}>
                        {
                            index > 0 ? <br /> : null
                        }

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
                                                <source key={href} src={href} />
                                            ))
                                        }
                                    </audio>
                                );
                            }
                        })()}
                        {
                            item.description_text?.trim().length < 1 ? null : (
                                <p style={{paddingBlockStart: 10}}>{item.description_text}</p>
                            )
                        }
                    </div>
                ))}
            </div>
        );
    }
}
