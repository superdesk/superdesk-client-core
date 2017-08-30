import React, {Component} from 'react';
import PropTypes from 'prop-types';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import TableControls from './TableControls';
import {LinkButton} from '../links';
import {LinkInput} from '../links';
import {ImageButton} from '../images';
import {EmbedButton} from '../embeds';
import {TableButton} from '../tables';
import {connect} from 'react-redux';
import {LinkToolbar} from '../links';
import {CommentButton, CommentInput} from '../comments';
import classNames from 'classnames';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {boolean} disabled Disables clicking on the toolbar, if true.
 * @description Holds the editor's toolbar.
 */
class ToolbarComponent extends Component {
    constructor(props) {
        super(props);

        this.showLinkInput = this.showLinkInput.bind(this);
        this.hideLinkInput = this.hideLinkInput.bind(this);
        this.showCommentInput = this.showCommentInput.bind(this);
        this.hideCommentInput = this.hideCommentInput.bind(this);

        this.state = {
            // If non-null, it contains the link that is currently being edited
            // (or empty for a new link) and the popup is shown.
            editedLink: null,

            // If non-null, contains a DraftJS SelectionState where a comment
            // needs to be added (the popup is displayed).
            selectionForComment: null
        };
    }

    /**
     * @ngdoc method
     * @name Toolbar#hideLinkInput
     * @description Hides the link input.
     */
    hideLinkInput() {
        this.setState({editedLink: null});
    }

    /**
     * @ngdoc method
     * @name Toolbar#showLinkInput
     * @param {Event} e
     * @param {Object} link object to edit
     * existing link.
     * @description Shows the link input box.
     */
    showLinkInput(link) {
        const isNewLink = !link;
        const isCollapsed = this.props.editorState.getSelection().isCollapsed();

        // only add new links if there is a selection
        if (isNewLink && isCollapsed) {
            return;
        }

        this.setState({editedLink: link});
    }

    showCommentInput(selection) {
        this.setState({selectionForComment: selection});
    }

    hideCommentInput() {
        this.setState({selectionForComment: null});
    }

    render() {
        const {
            disabled,
            editorFormat,
            activeCell,
            applyLink,
            editorState,
            applyComment,
        } = this.props;

        const {editedLink, selectionForComment} = this.state;
        const has = (opt) => editorFormat.indexOf(opt) > -1;

        const cx = classNames({
            'Editor3-controls': true,
            disabled: disabled
        });

        return activeCell !== null ? <TableControls /> :
            <div className={cx}>
                <BlockStyleControls />
                <InlineStyleControls />

                {has('anchor') && <LinkButton onClick={this.showLinkInput} />}

                {editedLink !== null &&
                    <LinkInput
                        editorState={editorState}
                        onSubmit={applyLink}
                        onCancel={this.hideLinkInput}
                        value={editedLink} />}

                {has('picture') && <ImageButton />}
                {has('embed') && <EmbedButton />}
                {has('table') && <TableButton />}

                <CommentButton onClick={this.showCommentInput} />

                {selectionForComment !== null &&
                    <CommentInput
                        onSubmit={(msg) => applyComment(selectionForComment, msg)}
                        onCancel={this.hideCommentInput} />}


                {/* LinkToolbar must be the last node. */}
                <LinkToolbar onEdit={this.showLinkInput} />
            </div>;
    }
}

ToolbarComponent.propTypes = {
    disabled: PropTypes.bool,
    editorFormat: PropTypes.array,
    activeCell: PropTypes.any,
    applyLink: PropTypes.func,
    applyComment: PropTypes.func,
    editorState: PropTypes.object
};

const mapStateToProps = ({editorFormat, editorState, activeCell}) => ({
    editorFormat, editorState, activeCell
});

const mapDispatchToProps = (dispatch) => ({
    applyLink: (link, entity = null) => dispatch(actions.applyLink({link, entity})),
    applyComment: (sel, msg) => dispatch(actions.applyComment(sel, msg)),
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;
