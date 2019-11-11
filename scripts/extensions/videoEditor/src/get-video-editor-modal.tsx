import * as React from 'react';
import { IArticle, ISuperdesk } from 'superdesk-api';
import { VideoEditor } from './VideoEditor';
import { VideoEditorProvider } from './VideoEditorContext';

export function getVideoEditModal(superdesk: ISuperdesk, article: IArticle) {
    return class VideoEditModal extends React.PureComponent<{ closeModal(): void }> {
        handleArticleUpdate = (updatedArticle: IArticle) => {
            if (article !== updatedArticle) {
                superdesk.entities.article.update(updatedArticle);
            }
        };

        render() {
            return (
                <VideoEditorProvider value={{ superdesk: superdesk }}>
                    <VideoEditor
                        article={article}
                        superdesk={superdesk}
                        onClose={this.props.closeModal}
                        onArticleUpdate={this.handleArticleUpdate}
                    />
                </VideoEditorProvider>
            );
        }
    };
}
