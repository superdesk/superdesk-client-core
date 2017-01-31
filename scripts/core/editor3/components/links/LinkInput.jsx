import React, {Component} from 'react';
import {getSelectedEntity} from './entityUtils';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkInput
 * @param {Object} editorState The editor state object.
 * @param {Function} onSubmit Function to call when submitting the form.
 * @param {Function} onCancel Function to call when cancelling submission.
 * @param {string} value The default value for the input.
 * @description This components holds the input form for entering a new URL.
 */
export default class LinkInput extends Component {
    constructor(props) {
        super(props);

        // when non-null, holds the entity whos URL is being edited
        this.entity = null;

        if (props.value) {
            // if a value has been passed, it is safe to assume that it
            // is coming from the currently selected entity
            this.entity = getSelectedEntity(props.editorState);
        }

        this.onSubmit = this.onSubmit.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
    }

    /**
     * @ngdoc method
     * @name LinkInput#onSubmit
     * @description Callback when submitting the form.
     */
    onSubmit() {
        const val = this.refs.input.value;

        if (val === '') {
            return;
        }

        this.props.onSubmit(val, this.entity);
        this.props.onCancel();
    }

    /**
     * @ngdoc method
     * @name LinkInput#onKeyUp
     * @description Handles key up events in the editor. Cancells input when
     * Esc is pressed.
     */
    onKeyUp(e) {
        if (e.key === 'Escape') {
            this.props.onCancel();
        }
    }

    componentDidMount() {
        this.refs.input.focus();
    }

    render() {
        return (
            <form onSubmit={this.onSubmit} className="link-input" onKeyUp={this.onKeyUp}>
                <input
                    type="url"
                    ref="input"
                    className="link-button-input"
                    placeholder="Enter a URL"
                    defaultValue={this.props.value} />

                <div className="link-input__controls">
                    <i className="svg-icon-ok" onClick={this.onSubmit} />
                    <i className="icon-close-small" onClick={this.props.onCancel} />
                </div>
            </form>
        );
    }
}

LinkInput.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    onSubmit: React.PropTypes.func.isRequired,
    onCancel: React.PropTypes.func.isRequired,
    value: React.PropTypes.string
};
