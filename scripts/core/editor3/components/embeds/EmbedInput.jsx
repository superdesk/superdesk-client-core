import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import ng from 'core/services/ng';

const fallbackAPIKey = '1d1728bf82b2ac8139453f'; // register to author's personal account

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Function} onCancel To be called when the input needs to be hidden.
 * @param {Function} onSubmit Dispatcher for the submit action. Takes the oEmbed response object as a parameter.
 * @name EmbedInputComponent
 * @description The dialog displayed when an embed URL is entered.
 */
class EmbedInputComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {error: ''};

        this.onKeyUp = this.onKeyUp.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.processSuccess = this.processSuccess.bind(this);
        this.processError = this.processError.bind(this);
    }

    componentDidMount() {
        this.refs.txt.focus();
    }

    /**
     * @ngdoc method
     * @name EmbedInputComponent#onKeyUp
     * @param {Event} e
     * @description Handles key up events in the input. Cancels on ESC.
     */
    onKeyUp(e) {
        if (e.key === 'Escape') {
            this.props.onCancel();
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
    processSuccess(data, status) {
        this.props.onSubmit(data);
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
    processError(data, status) {
        this.setState({error: data.responseJSON.error});
    }

    /**
     * @ngdoc method
     * @name EmbedInputComponent#onKeyUp
     * @param {Object} data
     * @param {String} status
     * @description Verifies with the iframe.ly API if the submitted URL is valid.
     */
    onSubmit() {
        const {value} = this.refs.txt;
        const config = ng.get('config');
        const apiKey = config.iframely.key || fallbackAPIKey;

        $.ajax({
            url: `//iframe.ly/api/oembed?callback=?&url=${value}&api_key=${apiKey}&omit_script=true&iframe=true`,
            dataType: 'json'
        }).then(this.processSuccess, this.processError);
    }

    /**
     * @ngdoc method
     * @name EmbedInputComponent#onCancel
     * @description Calls the onCancel prop function and resets the error state.
     */
    onCancel() {
        this.setState({error: ''});
        this.props.onCancel();
    }

    render() {
        const {onCancel} = this.props;
        const {error} = this.state;

        return (
            <form onSubmit={this.onSubmit} className="embed-dialog" onKeyUp={this.onKeyUp}>
                <input type="url" ref="txt" placeholder="Enter a URL to embed" />
                <div className="input-controls">
                    <i className="icon-search" onClick={this.onSubmit} />
                    <i className="icon-close-small" onClick={onCancel} />
                </div>
                {error ? <div className="embed-dialog__error">{error}</div> : null}
            </form>
        );
    }
}

EmbedInputComponent.propTypes = {
    onCancel: React.PropTypes.func.isRequired,
    onSubmit: React.PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (oEmbed) => dispatch(actions.embed(oEmbed))
});

export const EmbedInput = connect(null, mapDispatchToProps)(EmbedInputComponent);
