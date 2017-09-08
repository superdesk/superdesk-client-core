import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import Textarea from 'react-textarea-autosize';

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

        this.state = {msg: ''};
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentInput#onSubmit
     * @description onSubmit is called when the user clicks the Submit button in the UI.
     * Consequently, it calls the `onSubmit` prop, passing it the value of the text input.
     */
    onSubmit() {
        const {msg} = this.state;
        const {onSubmit, onCancel} = this.props;

        if (msg !== '') {
            onSubmit(msg);
            onCancel();
        }
    }

    /**
     * @ngdoc method
     * @name CommentInput#onChange
     * @description onChange is triggered when the Textarea content changes.
     */
    onChange({target}) {
        this.setState({msg: target.value});
    }

    onKeyUp({nativeEvent}) {
        const {keyCode, shiftKey} = nativeEvent;

        if (keyCode === 13 && shiftKey) {
            this.onSubmit();
        }
    }

    componentDidMount() {
        $(this.input)
            .find('textarea')
            .focus();
    }

    render() {
        const {msg} = this.state;

        return (
            <div className="comment-input">
                <Dropdown open={true}>
                    <Textarea
                        ref={(el) => {
                            this.input = el;
                        }}
                        className="comment-text"
                        onChange={this.onChange}
                        placeholder={gettext('Type your comment...')}
                        onKeyUp={this.onKeyUp}
                        value={msg}
                    />
                    <div className="pull-right">
                        <button className="btn btn--cancel" onClick={this.props.onCancel}>{gettext('Cancel')}</button>
                        <button className="btn btn--primary" onClick={this.onSubmit}>{gettext('Submit')}</button>
                    </div>
                </Dropdown>
            </div>
        );
    }
}

CommentInput.propTypes = {
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func
};
