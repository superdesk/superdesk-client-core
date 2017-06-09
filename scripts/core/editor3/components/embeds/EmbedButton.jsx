import React, {Component} from 'react';
import {EmbedInput} from '.';
import {loadIframelyEmbedJs} from './loadIframely';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name EmbedButton
 * @description The embed button to be used on the toolbar.
 */
export class EmbedButton extends Component {
    constructor(props) {
        super(props);

        this.state = {dialogOpen: false};

        this.showInput = this.showInput.bind(this);
        this.hideInput = this.hideInput.bind(this);
    }

    componentDidMount() {
        loadIframelyEmbedJs();
    }

    /**
     * @ngdoc method
     * @name EmbedButton#showInput
     * @description Sets the state of the input to visible.
     */
    showInput() {
        this.setState({dialogOpen: true});
    }

    /**
     * @ngdoc method
     * @name EmbedButton#hideInput
     * @description Sets the state of the input to hidden.
     */
    hideInput() {
        this.setState({dialogOpen: false});
    }

    render() {
        const {dialogOpen} = this.state;

        return (
            <div data-flow={'down'} data-sd-tooltip="Embed content" className="Editor3-styleButton">
                <span onClick={this.showInput}><i className="icon-code" /></span>
                {dialogOpen ? <EmbedInput onCancel={this.hideInput} /> : null}
            </div>
        );
    }
}
