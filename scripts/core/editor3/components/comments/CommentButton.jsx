import React from 'react';
import {EditorState} from 'draft-js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentButtonComponent
 * @param {Object} editorState
 * @param {Function} onClick
 * @description CommentButtonComponent renders the 'Add a comment' toolbar button.
 */
class CommentButtonComponent extends React.Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentButtonComponent#onClick
     * @description onClick is called when the button is clicked in the UI. In turn,
     * it calls the `onClick` prop, passing it the current selection onto which the
     * new comment should be added.
     */
    onClick() {
        const {editorState, onClick} = this.props;
        const isCollapsed = editorState.getSelection().isCollapsed();

        if (!isCollapsed) {
            onClick(editorState.getSelection());
        }
    }

    render() {
        const {editorState} = this.props;
        const inactive = editorState.getSelection().isCollapsed();
        const cx = classNames({inactive});

        return (
            <div data-flow={'down'} data-sd-tooltip={gettext('Add comment')} className="Editor3-styleButton">
                <span className={cx} onClick={this.onClick}>
                    <i className="icon-comment" />
                </span>
            </div>
        );
    }
}

CommentButtonComponent.propTypes = {
    editorState: PropTypes.instanceOf(EditorState),
    onClick: PropTypes.func
};

const mapStateToProps = ({editorState}) => ({editorState});

export const CommentButton = connect(mapStateToProps, null)(CommentButtonComponent);
