import React from 'react';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {ISubscriber} from 'superdesk-interfaces/Subscriber';
import {IArticle} from 'superdesk-api';
import {IDestination} from 'superdesk-interfaces/Destination';
import {Button, Modal} from 'superdesk-ui-framework/react';

const getFormattedDocument = (url) => fetch(
    url,
    {
        method: 'GET',
        headers: {
            'Authorization': ng.get('session').token,
        },
    },
).then(
    (response) => response.text()
        .then((responseText) => ({
            fomattedDocument: responseText,
            documentContentType: response.headers.get('content-type'),
        })),
);

interface IProps {
    subscribers: Array<ISubscriber>;
    itemId: IArticle['_id'];
    closeModal(): void;
}

function publishPreviewEnabled(destination: IDestination): boolean {
    return (destination.preview_endpoint_url ?? '').length > 0;
}

export class PreviewModal extends React.Component<IProps> {
    static propTypes: any;
    static defaultProps: any;

    openPreviewForItem(subscriberId, format, endpointUrl) {
        const {itemId} = this.props;
        const urls = ng.get('urls');

        const nextWindow = window.open();

        nextWindow.document.body.innerText = gettext('Loading preview');

        const url = urls.item('format-document-for-preview')
            + `?subscriber_id=${subscriberId}&formatter=${format}&document_id=${itemId}`;

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
                            `<h1>${gettext('An error occurred while trying to preview the item.')}</h1>`
                            + `<p>${gettext('Ensure correct preview endpoint is configured'
                                + ' or contact endpoint maintainers.')}</p>`
                            + '<br /><br />' + responseText;
                    }
                }));
        });
    }

    render() {
        const {closeModal} = this.props;

        const subscribers = this.props.subscribers.filter(
            ({destinations}) => (destinations ?? []).some((dest) => publishPreviewEnabled(dest)),
        );

        return (
            <Modal
                visible
                zIndex={1050}
                size="small"
                position="top"
                headerTemplate={gettext('Select preview target')}
                footerTemplate={
                    <Button type="default" text={gettext('Cancel')} onClick={closeModal} />
                }
            >
                <ul>
                    {
                        subscribers.map((subscriber, i) => (
                            <li key={i}>
                                <strong>{subscriber.name}</strong>
                                <ul>
                                    {
                                        subscriber.destinations
                                            .filter((dest) => publishPreviewEnabled(dest))
                                            .map((destination, j) => (
                                                <li
                                                    key={j}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        margin: '4px 0',
                                                    }}
                                                >
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
            </Modal>
        );
    }
}
