import ReactDOM from 'react-dom';
import React from 'react';
import {find, matches} from 'lodash';

interface IMessageDisplayDurationByType {
    info: number;
    success: number;
    warning: number;
    error: number;
}

const messageDisplayDurationsByType: IMessageDisplayDurationByType = {
    info: 3000,
    success: 3000,
    warning: 5000,
    error: 8000,
};

interface IState {
    messages: Array<any>;
}

class NotifyComponent extends React.Component<any, IState> {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
        };
    }
    info(text: string, displayDuration?, options?) {
        this.addMessage('info', text, displayDuration, options);
    }
    success(text: string, displayDuration?, options?) {
        this.addMessage('success', text, displayDuration, options);
    }
    warning(text: string, displayDuration?, options?) {
        this.addMessage('warning', text, displayDuration, options);
    }
    error(text: string, displayDuration?, options?) {
        this.addMessage('error', text, displayDuration, options);
    }
    startSaving() {
        this.info(gettext('Saving...'));
    }
    stopSaving() {
        this.pop();
    }
    removeMessage(indexToRemoveAt) {
        this.setState({
            messages: this.state.messages.filter((_, i) => i !== indexToRemoveAt),
        });
    }

    // DEPRECATED (keeping for compatibility)
    // messages should be removed by text/id, not by index
    // since users can remove messages from any position from UI
    // when removing by index you are never sure which one you are removing
    pop() {
        this.setState({
            messages: this.state.messages.slice(0, this.state.messages.length - 1),
        });
    }
    addMessage(
        type: keyof IMessageDisplayDurationByType,
        text,
        displayDuration = messageDisplayDurationsByType[type],
        options = {},
    ) {
        if (find(this.state.messages, matches({msg: text})) !== undefined) {
            return; // add message, only if it's does not already exist
        }

        this.setState({
            messages: this.state.messages.concat({type: type, msg: text, options: options}),
        }, () => {
            setTimeout(() => {
                this.setState({
                    messages: this.state.messages.filter(({msg}) => msg !== text),
                });
            }, displayDuration);
        });
    }

    render() {
        return (
            <div className="notification-holder">
                {
                    this.state.messages.map((msg, i) => (
                        <div key={i} className={'alert alert-' + msg.type} onClick={() => this.removeMessage(i)}>
                            {gettext(msg.msg)}

                            {
                                (msg.options == null || !msg.options.button) ? null : (
                                    <div className="pull-right">
                                        <button
                                            className="btn btn--hollow btn--small"
                                            onClick={msg.options.button.onClick}>
                                            {msg.options.button.label}
                                        </button>
                                    </div>
                                )
                            }
                        </div>
                    ))
                }
            </div>
        );
    }
}

/**
 * @ngdoc module
 * @module superdesk.core.notify
 * @name superdesk.core.notify
 * @packageName superdesk.core
 * @description The notify package allows developers to display various
 * notifications for users.
 */
export default angular.module('superdesk.core.notify', ['superdesk.core.translate'])
    .service('notify', ['gettext', function(gettext) {
        const targetEl = document.createElement('div');

        document.body.appendChild(targetEl);

        // eslint-disable-next-line
        return ReactDOM.render(<NotifyComponent />, targetEl); // returns instance of NotifyComponent
    }]);
