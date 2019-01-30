import React from 'react';
import PropTypes from 'prop-types';

import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {gettext} from 'core/ui/components/utils';

const getFormattedDocument = (url) => fetch(url).then(
    (response) => response.text()
        .then((responseText) => ({
            fomattedDocument: responseText,
            documentContentType: response.headers.get('content-type'),
        })),
);

export class PreviewModal extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    openPreviewForItem(subscriberId, format, endpointUrl) {
        const {urls, documentId} = this.props;

        const nextWindow = window.open();

        nextWindow.document.body.innerText = gettext('Loading preview');

        const url = urls.item('format-document-for-preview')
            + `?subscriber_id=${subscriberId}&formatter=${format}&document_id=${documentId}`;

        getFormattedDocument(url).then(({fomattedDocument, documentContentType}) => {
            const headers = new Headers();

            headers.append('Content-Type', documentContentType);

            fetch(endpointUrl, {
                method: 'POST',
                mode: 'cors',
                body: fomattedDocument,
                headers: headers,
            })
                .then((res) => res.text().then((responseText) => {
                    if (res.status === 200) {
                        nextWindow.document.body.innerHTML = responseText;
                    } else {
                        nextWindow.document.body.innerHTML =
                            `<h1>${gettext('An error occured while trying to preview the item.')}</h1>`
                            + `<p>${gettext('Ensure correct preview endpoint is configured'
                                + ' or contact endpoint maintainers.')}</p>`
                            + '<br /><br />' + responseText;
                    }
                }));
        });
    }
    render() {
        const {closeModal, subscribersWithPreviewConfigured} = this.props;

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
                                                                destination.preview_endpoint_url,
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
};
