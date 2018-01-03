import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import {connect} from 'react-redux';
import {applyComment, hidePopups} from '../../actions';
import CommentTextArea from './CommentTextArea';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentInputBody
 * @param {Function} applyComment Called when a new comment is submitted. It receives the
 * comment body as a parameter.
 * @param {Function} hidePopups
 * @description CommentInputBody holds the dropdown that is used to enter the text for a
 * comment.
 */
class CommentInputBody extends Component {
    constructor(props) {
        super(props);
        this.state = {msg: props.data.msg || ''};
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#onSubmit
     * @description onSubmit is called when the user clicks the Submit button in the UI.
     * Consequently, it calls the `onSubmit` prop, passing it the value of the text input.
     */
    onSubmit() {
        const {msg} = this.state;
        const {applyComment, hidePopups, data} = this.props;

        if (msg !== '') {
            applyComment(data.selection, {msg});
            hidePopups();
        }
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#onChange
     * @description onChange is triggered when the Textarea content changes.
     */
    onChange(ev, value) {
        this.setState({msg: value});
    }

    render() {
        const {msg} = this.state;

        return (
            <div className="comment-input">
                <Dropdown open={true}>
                    <CommentTextArea
                        value={msg}
                        onChange={this.onChange}
                    />
                    <div className="pull-right">
                        <button className="btn btn--cancel" onClick={this.props.hidePopups}>{gettext('Cancel')}</button>
                        <button className="btn btn--primary" onClick={this.onSubmit}>{gettext('Submit')}</button>
                    </div>
                </Dropdown>
            </div>
        );
    }
}

CommentInputBody.propTypes = {
    applyComment: PropTypes.func,
    hidePopups: PropTypes.func,
    data: PropTypes.object
};

export const CommentInput = connect(null, {
    applyComment,
    hidePopups
})(CommentInputBody);
