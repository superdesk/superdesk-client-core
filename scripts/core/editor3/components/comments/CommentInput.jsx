import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentInput
 * @param {Function} onSubmit Called when a new comment is submitted. It receives the
 * comment body as a parameter.
 * @param {Function} onCancel
 * @description CommentInput holds the dropdown that is used to enter the text for a
 * comment.
 */
export class CommentInput extends Component {
    constructor(props) {
        super(props);

        this.onSubmit = this.onSubmit.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentInput#onSubmit
     * @description onSubmit is called when the user clicks the Submit button in the UI.
     * Consequently, it calls the `onSubmit` prop, passing it the value of the text input.
     */
    onSubmit() {
        const {value} = this.input;
        const {onSubmit, onCancel} = this.props;

        if (value !== '') {
            onSubmit(value);
            onCancel();
        }
    }

    componentDidMount() {
        this.input.focus();
    }

    render() {
        return (
            <Dropdown open={true}>
                <input type="text"
                    ref={(el) => {
                        this.input = el;
                    }}
                    className="sd-line-input__input"
                    placeholder={gettext('Type comment here')}
                />
                <div className="pull-right">
                    <button className="btn btn--cancel" onClick={this.props.onCancel}>{gettext('Cancel')}</button>
                    <button className="btn btn--primary" onClick={this.onSubmit}>{gettext('Submit')}</button>
                </div>
            </Dropdown>
        );
    }
}

CommentInput.propTypes = {
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func
};
