import * as React from 'react';
import {IArticle, ISuperdesk} from 'superdesk-api';

export function getVideoEditModal(superdesk: ISuperdesk, article: IArticle) {
    const {gettext} = superdesk.localization;

    return class VideoEditModal extends React.PureComponent<{closeModal(): void}> {
        render() {
            return (
                <div className="modal modal--fullscreen modal--dark-ui in" style={{zIndex: 1050, display: 'block'}}>
                    <div className="modal__dialog">
                        <div className="modal__content">
                            <div className="modal__header modal__header--flex">
                                <h3 className="modal__heading">{gettext('Modal Fullscreen')}</h3>
                                <button className="icn-btn" onClick={this.props.closeModal}>
                                    <i className="icon-close-small" />
                                </button>
                            </div>

                            <div className="modal__body">
                                <p>{gettext('This is sample message inside modal!')}</p>
                            </div>

                            <div className="modal__footer">
                                <button className="btn">{gettext('Cancel')}</button>
                                <button className="btn btn--primary" onClick={() => {
                                    superdesk.dataApi.findOne<IArticle>('archive', article._id)
                                        .then((fetchedArticled) => {
                                            alert(fetchedArticled._id);
                                        });
                                }}>{gettext('Ok')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };
}
