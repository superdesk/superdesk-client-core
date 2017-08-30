import React from 'react';
import {EditorState} from 'draft-js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';

class CommentButtonComponent extends React.Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
    }

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
