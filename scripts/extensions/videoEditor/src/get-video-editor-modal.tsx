import * as React from 'react';
import { IArticle, ISuperdesk } from 'superdesk-api';
import { VideoEditor } from './VideoEditor';

export function getVideoEditModal(superdesk: ISuperdesk, article: IArticle) {
    return class VideoEditModal extends React.PureComponent<{ closeModal(): void }> {
        render() {
            return <VideoEditor article={article} superdesk={superdesk} onClose={this.props.closeModal} />;
        }
    };
}
