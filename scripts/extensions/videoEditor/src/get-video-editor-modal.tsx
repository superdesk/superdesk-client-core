import * as React from 'react';
import {IArticle, ISuperdesk} from 'superdesk-api';
import {VideoEditor} from './VideoEditor';
import {VideoEditorProvider} from './VideoEditorContext';

export function getVideoEditModal(superdesk: ISuperdesk, article: IArticle) {
    return class VideoEditModal extends React.PureComponent<{closeModal(): void}> {
        render() {
            return (
                <VideoEditorProvider value={superdesk}>
                    <VideoEditor
                        article={article}
                        superdesk={superdesk}
                        onClose={this.props.closeModal}
                        onArticleUpdate={superdesk.entities.article.update}
                    />
                </VideoEditorProvider>
            );
        }
    };
}
