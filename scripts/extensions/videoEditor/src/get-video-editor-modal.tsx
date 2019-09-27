import * as React from 'react';
import { IArticle, ISuperdesk } from 'superdesk-api';
import { VideoEditor } from './VideoEditor';
import { ListThumbnails } from './VideoTimeline/ListThumbnails';

export function getVideoEditModal(superdesk: ISuperdesk, article: IArticle) {
    const { gettext } = superdesk.localization;
    const { getClass } = superdesk.utilities.CSS;

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
                                <VideoEditor article={article} getClass={getClass} />
                                <ListThumbnails
                                    thumbnails={[]}
                                    widthPic={90}
                                    numberThumbnails={40}
                                    videoDuration={120}
                                    videoUrl="http://192.168.100.36:5050/projects/5d89d6f8881aec8c5a77a4e4/raw/video?tag=6da964ad2728ca9c0356aa22b6bc6bd3b3ec2a41"
                                />
                            </div>

                            <div className="modal__footer">
                                <button className="btn">{gettext('Cancel')}</button>
                                <button
                                    className="btn btn--primary"
                                    onClick={() => {
                                        superdesk.dataApi
                                            .findOne<IArticle>('archive', article._id)
                                            .then(fetchedArticled => {
                                                alert(fetchedArticled._id);
                                            });
                                    }}
                                >
                                    {gettext('Ok')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };
}
