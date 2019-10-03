import * as React from 'react';
import { IExtension, IExtensionActivationResult, ISuperdesk } from 'superdesk-api';
import { getVideoEditModal } from './get-video-editor-modal';
import { IArticleVideo } from './VideoEditor';
import { get } from 'lodash';

function getEditVideoAction(superdesk: ISuperdesk) {
    const { gettext } = superdesk.localization;
    const { showModal } = superdesk.ui;

    return class EditVideoAction extends React.PureComponent<{ article: IArticleVideo }> {
        render() {
            if (
                this.props.article.type === 'video' &&
                'video_editor_id' in get(this.props.article, 'renditions.original')
            ) {
                return (
                    <button
                        className="btn btn--hollow btn--small"
                        onClick={() => {
                            showModal(getVideoEditModal(superdesk, this.props.article));
                        }}
                    >
                        {gettext('Edit video')}
                    </button>
                );
            } else {
                return null;
            }
        }
    };
}

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const result: IExtensionActivationResult = {
            contributions: {
                mediaActions: [getEditVideoAction(superdesk)],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
