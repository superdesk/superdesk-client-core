import React, {Component} from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import moment from 'moment';
import {getVisibleSelectionRect, SelectionState} from 'draft-js';

const topPadding = 50;

export class CommentPopup extends Component {
    position() {
        const {left: editorLeft} = this.props.editor.getBoundingClientRect();
        const rect = getVisibleSelectionRect(window);

        let top = 150;
        let left = editorLeft - 260;

        if (rect) {
            top = rect.top - topPadding;
        }

        return {top, left};
    }

    component() {
        const {author, date, msg} = this.props.comment.data;
        const fromNow = moment(date).fromNow();
        const pretty = moment(date).format('MMMM Do YYYY, h:mm:ss a');
        const position = this.position();

        return (
            <div className="comment-popup" style={position}>
                <Dropdown open={true}>
                    <b>{author}</b> wrote <span title={pretty}>{fromNow}</span>:
                    <div className="comment-popup__body">{msg}</div>
                </Dropdown>
            </div>
        );
    }

    customRender() {
        const node = document.getElementById('react-placeholder');

        if (this.props.comment) {
            render(this.component(), node);
        } else {
            unmountComponentAtNode(node);
        }
    }

    shouldComponentUpdate(nextProps) {
        const nextSelection = nextProps.selection;
        const {selection} = this.props;

        return nextSelection.getAnchorOffset() !== selection.getAnchorOffset() ||
            nextSelection.getAnchorKey() !== selection.getAnchorKey();
    }

    componentDidUpdate() {
        // Waiting one cycle allows the selection to be rendered in the browser
        // so that we can correctly retrieve its position.
        setTimeout(this.customRender.bind(this), 0);
    }

    render() {
        return null;
    }
}

CommentPopup.propTypes = {
    selection: PropTypes.instanceOf(SelectionState),
    editor: PropTypes.object,
    comment: PropTypes.shape({
        data: PropTypes.shape({
            msg: PropTypes.string,
            author: PropTypes.string,
            date: PropTypes.date
        })
    })
};
