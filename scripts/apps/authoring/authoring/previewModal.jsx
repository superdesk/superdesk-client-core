import React from 'react';
import PropTypes from 'prop-types';

import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';

function getFormattedDocument(url) {
    return new Promise((resolve) => {
        var xhr = new XMLHttpRequest();

        xhr.addEventListener('load', function() {
            resolve({
                fomattedDocument: this.responseText,
                documentContentType: this.getResponseHeader('content-type'),
            });
        });

        xhr.open('GET', url);
        xhr.send();
    });
}

export class PreviewModal extends React.Component {
    openPreviewForItem(subscriberId, format, endpointUrl) {
        const {urls, documentId, gettext} = this.props;

        const nextWindow = window.open();

        nextWindow.document.body.innerText = gettext('Loading preview');

        const url = urls.item('format-document-for-preview')
            + `?subscriber_id=${subscriberId}&formatter=${format}&document_id=${documentId}`;

        getFormattedDocument(url).then(({fomattedDocument, documentContentType}) => {
            var xhr = new XMLHttpRequest();

            xhr.open('POST', endpointUrl);
            xhr.setRequestHeader('Content-Type', documentContentType);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        nextWindow.document.body.innerHTML = this.responseText;
                    } else {
                        nextWindow.document.body.innerText =
                            gettext(
                                'An error occured while trying to preview the item.'
                                + ' Ensure correct preview endpoint is configured or contact endpoint maintainers.'
                            )
                            + '\n\n' + this.responseText;
                    }
                }
            };
            xhr.send(fomattedDocument);
        });
    }
    render() {
        const {closeModal, subscribersWithPreviewConfigured, gettext} = this.props;

        return (
            <Modal>
                <ModalHeader>{gettext('Select preview target')}</ModalHeader>
                <ModalBody>
                    <ul>
                        {
                            subscribersWithPreviewConfigured.map((subscriber, i) => (
                                <li key={i}>
                                    <strong>{subscriber.name}</strong>
                                    <ul>
                                        {
                                            subscriber.destinations.map((destination, j) => (
                                                <li key={j} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    margin: '4px 0',
                                                }}>
                                                    <span>{destination.name}</span>
                                                    <button
                                                        className="btn btn--primary btn--small"
                                                        onClick={() => {
                                                            this.openPreviewForItem(
                                                                subscriber._id,
                                                                destination.format,
                                                                destination.preview_endpoint_url
                                                            );
                                                        }}
                                                    >
                                                        {gettext('preview')}
                                                    </button>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </li>
                            ))
                        }
                    </ul>
                </ModalBody>
                <ModalFooter>
                    <button className="btn" onClick={closeModal}>{gettext('Cancel')}</button>
                </ModalFooter>
            </Modal>
        );
    }
}

PreviewModal.propTypes = {
    subscribersWithPreviewConfigured: PropTypes.array.isRequired,
    documentId: PropTypes.string.isRequired,
    urls: PropTypes.object.isRequired,
    closeModal: PropTypes.func.isRequired,
    gettext: PropTypes.func.isRequired,
};