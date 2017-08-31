import React, {Component} from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import moment from 'moment';
import {getVisibleSelectionRect, SelectionState} from 'draft-js';

const topPadding = 50;

export class CommentPopup extends Component {
    position() {
        const rect = getVisibleSelectionRect(window);
        const {left: editorLeft} = this.props.editor.getBoundingClientRect();

        if (rect) {
            return {
                top: rect.top - topPadding,
                left: editorLeft - 260
            };
        }

        return {top: 0, left: 0};
    }

    component() {
        const {author, date, msg} = this.props.comment.data;
        const fromNow = moment(date).fromNow();
        const pretty = moment(date).format('MMMM Do YYYY, h:mm:ss a');

        return (
            <div className="comment-popup" style={this.position()}>
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
        return nextProps.selection.getAnchorOffset() !== this.props.selection.getAnchorOffset();
    }

    componentDidUpdate() {
        this.customRender();
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
