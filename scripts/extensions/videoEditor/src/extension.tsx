import * as React from 'react';
import {IExtension, IExtensionActivationResult, ISuperdesk, IArticle} from 'superdesk-api';
import {getVideoEditModal} from './get-video-editor-modal';
import {showModal} from '@superdesk/common';

function getEditVideoAction(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return class EditVideoAction extends React.PureComponent<{article: IArticle}> {
        render() {
            if (
                this.props.article.type === 'video'
                && this.props.article?.renditions?.original?.video_editor_id != null
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
