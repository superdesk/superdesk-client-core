import React from 'react';
import PropTypes from 'prop-types';
import {loadIframelyEmbedJs} from './loadIframely';
import ng from 'core/services/ng';
import {connect} from 'react-redux';
import {embed, hidePopups} from '../../actions';

const fallbackAPIKey = '1d1728bf82b2ac8139453f'; // register to author's personal account
const GenericError = gettext('This URL could not be embedded.');

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Function} hidePopups To be called when the input needs to be hidden.
 * @param {Function} onSubmit Dispatcher for the submit action. Takes the oEmbed response object as a parameter.
 * @name EmbedInputComponent
 * @description The dialog displayed when an embed URL is entered.
 */
export class EmbedInputComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    txt: any;

    constructor(props) {
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
        this.props.embed(data);
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
    processError(data: any = {}, status) {
        const {responseJSON} = data;
        const hasMessage = responseJSON && responseJSON.error;
        const is404 = !hasMessage && data.status === 404;

        let error = hasMessage ? responseJSON.error : GenericError;

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

        const config = ng.get('config');
        const apiKey = config.iframely.key || fallbackAPIKey;

        $.ajax({
            url: `//iframe.ly/api/oembed?callback=?&url=${value}&api_key=${apiKey}&omit_script=true&iframe=true`,
            dataType: 'json',
        })
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
                <input type="url"
                    ref={(txt) => {
                        this.txt = txt;
                    }}
                    placeholder={gettext('Enter URL or code to embed')} />
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

EmbedInputComponent.propTypes = {
    embed: PropTypes.func.isRequired,
    hidePopups: PropTypes.func.isRequired,
};

export const EmbedInput: React.StatelessComponent<any> = connect(null, {
    embed,
    hidePopups,
})(EmbedInputComponent);
