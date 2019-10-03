import * as React from 'react';
import { IArticle, ISuperdesk } from 'superdesk-api';
import { VideoEditor } from './VideoEditor';

export function getVideoEditModal(superdesk: ISuperdesk, article: IArticle) {
    const { gettext } = superdesk.localization;

    return class VideoEditModal extends React.PureComponent<{ closeModal(): void }> {
        render() {
            return (
                <div className="modal modal--fullscreen modal--dark-ui in" style={{ zIndex: 1050, display: 'block' }}>
                    <div className="modal__dialog">
                        <div className="modal__content">
                            <div className="modal__header modal__header--flex">
                                <h3 className="modal__heading">{gettext('Modal Fullscreen')}</h3>
                                <button className="icn-btn" onClick={this.props.closeModal}>
                                    <i className="icon-close-small" />
                                </button>
                            </div>

                            <div className="modal__body modal__body--no-padding">
                                <VideoEditor article={article} superdesk={superdesk} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };
}
