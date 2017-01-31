import React, {Component} from 'react';
import EmbedInput from './EmbedInput';
import {loadIframelyEmbedJs} from './loadIframely';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name EmbedButton
 * @description The embed button to be used on the toolbar.
 */
class EmbedButton extends Component {
    constructor(props) {
        super(props);

        this.state = {dialogOpen: false};

        this.openDialog = this.openDialog.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
    }

    componentDidMount() {
        loadIframelyEmbedJs();
    }

    openDialog() {
        this.setState({dialogOpen: true});
    }

    closeDialog() {
        this.setState({dialogOpen: false});
    }

    render() {
        const {dialogOpen} = this.state;

        return (
            <div className="Editor3-styleButton">
                <span onClick={this.openDialog}>embed</span>
                {dialogOpen ? <EmbedInput onCancel={this.closeDialog} /> : null}
            </div>
        );
    }
}

export default EmbedButton;
