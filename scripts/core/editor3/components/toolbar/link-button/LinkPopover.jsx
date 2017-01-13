import React, {Component} from 'react';
import {getVisibleSelectionRect} from 'draft-js';
import * as common from '../../common';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkPopover
 * @param {Object} editorState the state of the editor
 * @param {Object} editorRect Position of editor on the screen (top, left).
 * @param {Function} onChange on change function to be called when the editor
 * state changes
 * @description This component holds the link editing popover displayed when clicking
 * a link in the editor and is part of LinkControl.
 */
export default class LinkPopover extends Component {
    constructor(props) {
        super(props);

        this.position = null;

        this.onEdit = this.onEdit.bind(this);
        this.updatePosition = this.updatePosition.bind(this);
    }

    /**
     * @ngdoc method
     * @name LinkPopover#onEdit
     * @description Called when the edit action is clicked in the popover.
     */
    onEdit() {
        const {editorState} = this.props;
        const url = common.getSelectedEntityData(editorState).url;

        this.props.onEdit(url);
    }

    /**
     * @ngdoc method
     * @name LinkPopover#updatePosition
     * @description Computes the position of the popover relative to the editor root.
     */
    updatePosition() {
        const rect = getVisibleSelectionRect(window);

        if (!rect) {
            return;
        }

        const {editorRect} = this.props;
        const top = rect.top - editorRect.top + 52;
        const left = rect.left - editorRect.left;

        this.position = {top, left};
    }

    render() {
        const {editorState} = this.props;
        const {url} = common.getSelectedEntityData(editorState);

        this.updatePosition();

        return this.position ?
            <div className="link-editor" style={this.position}>
                <a href={url} title={url} target="_blank">Open page</a>
                <i className="icon icon-pencil" onClick={this.onEdit} />
                <i className="icon icon-trash" onClick={this.props.onRemove} />
            </div> : null;
    }
}

LinkPopover.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    editorRect: React.PropTypes.object.isRequired,
    onEdit: React.PropTypes.func.isRequired,
    onRemove: React.PropTypes.func.isRequired
};
