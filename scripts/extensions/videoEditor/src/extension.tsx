import * as React from 'react';
import {IExtension, IExtensionActivationResult, IArticle, ISuperdesk} from 'superdesk-api';
import {getVideoEditModal} from './get-video-editor-modal';

function getEditVideoAction(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {showModal} = superdesk.ui;

    return class EditVideoAction extends React.PureComponent<{article: IArticle}> {
        render() {
            if (this.props.article.type === 'video') {
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
