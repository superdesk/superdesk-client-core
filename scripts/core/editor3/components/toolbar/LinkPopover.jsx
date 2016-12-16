import React, {Component} from 'react';
import {Entity, getVisibleSelectionRect, RichUtils} from 'draft-js';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkPopover
 * @param {Object} editorState the state of the editor
 * @param {Function} onChange on change function to be called when the editor
 * state changes
 * @description This component holds the link editing popover displayed when clicking
 * a link in the editor and is part of LinkControl.
 */
export default class LinkPopover extends Component {
    constructor(props) {
        super(props);

        this.popoverPosition = null;

        this.getSelectedEntityKey = this.getSelectedEntityKey.bind(this);
        this.getSelectedEntity = this.getSelectedEntity.bind(this);
        this.getSelectedEntityType = this.getSelectedEntityType.bind(this);
        this.getSelectedEntityData = this.getSelectedEntityData.bind(this);
        this.removeLink = this.removeLink.bind(this);
    }

    /**
     * @ngdoc method
     * @name LinkPopover#getSelectedEntityKey
     * @returns {string} Entity key.
     * @description Returns the key belonging to the entity that the cursor is on.
     */
    getSelectedEntityKey() {
        const {editorState} = this.props;

        const startKey = editorState.getSelection().getStartKey();
        const selectedBlock = editorState
            .getCurrentContent()
            .getBlockForKey(startKey);

        const offset = editorState.getSelection().getFocusOffset();

        return selectedBlock.getEntityAt(offset);
    }

    /**
     * @ngdoc method
     * @name LinkPopover#getSelectedEntity
     * @returns {Object} Entity.
     * @description Returns the entity under the cursor.
     */
    getSelectedEntity() {
        const entityKey = this.getSelectedEntityKey();

        return entityKey !== null ? Entity.get(entityKey) : null;
    }

    /**
     * @ngdoc method
     * @name LinkPopover#getSelectedType
     * @returns {string} Entity type.
     * @description Returns the entity type under the cursor.
     */
    getSelectedEntityType() {
        const e = this.getSelectedEntity();

        return e !== null ? e.getType() : null;
    }

    /**
     * @ngdoc method
     * @name LinkPopover#getSelectedData
     * @returns {Object} Entity data.
     * @description Returns the entity data under the cursor.
     */
    getSelectedEntityData() {
        const e = this.getSelectedEntity();

        return e !== null ? e.getData() : {};
    }

    /**
     * @ngdoc method
     * @name LinkPopover#removeLink
     * @description Removes the link on the entire entity under the cursor.
     */
    removeLink() {
        const e = this.getSelectedEntity();

        if (!e) {
            return;
        }

        const {editorState, onChange} = this.props;
        const selection = editorState.getSelection();
        const startKey = editorState.getSelection().getStartKey();
        const selectedBlock = editorState
            .getCurrentContent()
            .getBlockForKey(startKey);

        const entityKey = this.getSelectedEntityKey();

        selectedBlock.findEntityRanges(
            (c) => c.getEntity() === entityKey,
            (start, end) => {
                const entitySelection = selection.merge({
                    anchorOffset: start,
                    focusOffset: end
                });

                const stateAfterChange = RichUtils.toggleLink(editorState, entitySelection, null);

                onChange(stateAfterChange);
            }
        );
    }

    componentWillUpdate() {
        const selectionRect = getVisibleSelectionRect(window);

        if (selectionRect) {
            this.popoverPosition = {
                top: selectionRect.top + selectionRect.height + 2,
                left: selectionRect.left + 8,
            };
        }
    }

    render() {
        const isLinkSelected = this.getSelectedEntityType() === 'LINK';
        const shouldShow = isLinkSelected;
        const url = this.getSelectedEntityData().url;

        return shouldShow ?
            <div className="link-editor" style={this.popoverPosition}>
                <a href={url} target="_blank">{url}</a>
                <i className="icon icon-pencil" />
                <i className="icon icon-trash" onClick={this.removeLink} />
            </div>
        : null;
    }
}

LinkPopover.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired
};
