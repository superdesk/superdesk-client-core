import React from 'react';
import PropTypes from 'prop-types';
import {loadIframelyEmbedJs} from './loadIframely';
import {connect} from 'react-redux';
import {embed, hidePopups} from '../../actions';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

const fallbackAPIKey = '1d1728bf82b2ac8139453f'; // register to author's personal account

export const getEmbedObject = (url) => {
    const apiKey = appConfig.iframely.key || fallbackAPIKey;

    return $.ajax({
        url: `//iframe.ly/api/oembed?callback=?&url=${url}&api_key=${apiKey}&omit_script=true&iframe=true`,
        dataType: 'json',
    }).then((result) => {
        /**
         * No standard way of differentiating between an error and a valid response.
         * An observation was made that if the result doesn't contain an html field,
         * then the response is invalid. (SDANSA-556)
         */
        if (result.html == null) {
            return Promise.reject(result);
        }

        return result;
    });
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Function} hidePopups To be called when the input needs to be hidden.
 * @param {Function} onSubmit Dispatcher for the submit action. Takes the oEmbed response object as a parameter.
 * @name EmbedInputComponent
 * @description The dialog displayed when an embed URL is entered.
 */
interface IProps {
    embed?: (data: any) => void;
    hidePopups: () => void;
}

export class EmbedInputComponent extends React.Component<IProps, any> {
    static propTypes: any;
    static defaultProps: any;

    txt: any;

    constructor(props: IProps) {
        super(props);

        this.state = {error: ''};

        this.onKeyUp = this.onKeyUp.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.processSuccess = this.processSuccess.bind(this);
        this.processError = this.processError.bind(this);
    }

    /**
     * @ngdoc method
     * @name EmbedInputComponent#onKeyUp
     * @param {Event} e
     * @description Handles key up events in the input. Cancels on ESC.
     */
    onKeyUp(e) {
        if (e.key === 'Escape') {
            this.onCancel();
        }
    }

    /**
     * @ngdoc method
     * @name EmbedInputComponent#processResponse
     * @param {Object} data
     * @param {String} status
     * @description Processes the success XHR response from the iframe.ly request. Dispatches
     * the action that embeds the response into the editor.
     */
    processSuccess(data) {
        this.props.embed?.(data);
        this.onCancel();
    }

    /**
     * @ngdoc method
     * @name EmbedInputComponent#processError
     * @param {Object} data
     * @param {String} status
     * @description Processes the error XHR response from the iframe.ly request. Sets the state
     * to erroneous, which should be shown in the UI.
     */
    processError(data: any = {}) {
        const {responseJSON} = data;
        const hasMessage = responseJSON && responseJSON.error;
        const is404 = !hasMessage && data.status === 404;

        let error = hasMessage ? responseJSON.error : gettext('This URL could not be embedded.');

        if (is404) {
            error = gettext('URL not found.');
        }

        this.setState({error});
    }

    /**
     * @ngdoc method
     * @name EmbedInputComponent#onKeyUp
     * @param {Object} data
     * @param {String} status
     * @description Verifies with the iframe.ly API if the submitted URL is valid.
     */
    onSubmit() {
        const {value} = this.txt;

        if (!value.startsWith('http://') && !value.startsWith('https://')) {
            return this.processSuccess(value);
        }

        getEmbedObject(value)
            .then((data) => data.type === 'link' ? $.Deferred().reject() : data)
            .then(this.processSuccess, this.processError);
    }

    /**
     * @ngdoc method
     * @name EmbedInputComponent#onCancel
     * @description Calls the onCancel prop function and resets the error state.
     */
    onCancel() {
        this.setState({error: ''});
        this.props.hidePopups();
    }

    componentDidMount() {
        loadIframelyEmbedJs();
        this.txt.focus();
    }

    render() {
        const {error} = this.state;

        return (
            <form onSubmit={this.onSubmit} className="embed-dialog" onKeyUp={this.onKeyUp}>
                <OverlayTrigger
                    overlay={(
                        <Tooltip id="create_new_embed_tooltip">
                            <p>{gettext('To get a responsive embed code, paste a URL.')}</p>
                            <p>{gettext('If you paste an embed code, it will be used "as is".')}</p>
                        </Tooltip>
                    )}
                >
                    <i className="icon-info-sign icon--blue sd-margin-x--1" />
                </OverlayTrigger>
                <input
                    type="url"
                    ref={(txt) => {
                        this.txt = txt;
                    }}
                    placeholder={gettext('Enter URL or code to embed')}
                />
                <div className="input-controls">
                    <a className="icn-btn" onClick={this.onSubmit}>
                        <i className="icon-ok" />
                    </a>
                    <a className="icn-btn" onClick={this.onCancel}>
                        <i className="icon-close-small" />
                    </a>
                </div>
                {error ? <div className="embed-dialog__error">{error}</div> : null}
            </form>
        );
    }
}

export const EmbedInput = connect(null, {
    embed,
    hidePopups,
})(EmbedInputComponent);
