import * as React from 'react';

import {dataApi} from 'core/helpers/CrudManager';
import {toasted} from 'superdesk-ui-framework/react';
import {ISystemMessage, RESOURCE} from '..';
import {addWebsocketEventListener} from 'core/notification/notification';
import {IWebsocketMessage, IResourceUpdateEvent, IResourceCreatedEvent, IResourceDeletedEvent} from 'superdesk-api';
import {Position} from 'superdesk-ui-framework/react/components/ToastMessage';

export class SystemMessagesComponent extends React.PureComponent <{}> {
    messages: Array<{id: string; position: Position}>;
    eventListenersToRemove: Array<() => void>;

    constructor(props) {
        super(props);

        this.messages = [];
        this.eventListenersToRemove = [];
    }

    componentDidMount() {
        this.fetchAndShowActiveMessages();

        this.eventListenersToRemove.push(
            addWebsocketEventListener(
                'resource:updated',
                (event: IWebsocketMessage<IResourceUpdateEvent>) => {
                    const {resource} = event.extra;

                    if (resource === RESOURCE) {
                        this.reset();
                    }
                },
            ),
        );

        this.eventListenersToRemove.push(
            addWebsocketEventListener(
                'resource:created',
                (event: IWebsocketMessage<IResourceCreatedEvent>) => {
                    const {resource} = event.extra;

                    if (resource === RESOURCE) {
                        this.reset();
                    }
                },
            ),
        );

        this.eventListenersToRemove.push(
            addWebsocketEventListener(
                'resource:deleted',
                (event: IWebsocketMessage<IResourceDeletedEvent>) => {
                    const {resource} = event.extra;

                    if (resource === RESOURCE) {
                        this.reset();
                    }
                },
            ),
        );
    }

    componentWillUnmount() {
        this.eventListenersToRemove.forEach((func) => func());
    }

    reset() {
        this.clearMessages();
        this.fetchAndShowActiveMessages();
    }

    fetchAndShowActiveMessages() {
        dataApi.query<ISystemMessage>(RESOURCE, 1, {field: '_updated', direction: 'ascending'}, {is_active: true})
            .then((response) => {
                response._items.forEach((message) => this.renderToast(message));
            });
    }

    renderToast(message: ISystemMessage) {
        const content = (
            <div className="sd-toast__message">
                <div className="sd-toast__message-header">
                    <h4 className="sd-toast__message-header">{message.message_title}</h4>
                </div>
                <div dangerouslySetInnerHTML={{__html: message.message}} />
            </div>
        );

        const toast = toasted.notify(content, {
            type: message.type,
            position: 'top',
        });

        if (toast != null) {
            this.messages.push(toast);
        }
    }

    clearMessages() {
        this.messages.forEach((message) => toasted.close(message));
        this.messages = [];
    }

    render() {
        return null;
    }
}
