import React, {Component} from 'react';
import {RichUtils, Entity} from 'draft-js';
import classNames from 'classnames';
import LinkPopover from './LinkPopover';
import LinkInput from './LinkInput';
import * as common from '../../common';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkControl
 * @param {Object} editorState The editor state object.
 * @param {Object} editorOffset Absolute position in pixels (top, left) of the editor.
 * @param {Function} onChange on change function to be called when the editor
 * state changes
 * @description This component holds the link button for the toolbar and the small
 * link editing popover that displays when clicking a link.
 */
export default class LinkControl extends Component {
    /**
     * @ngdoc method
     * @name LinkControl#getDecorator
     * @static
     * @returns {Object} decorator object
     * @description Returns an object to be passed to the composite decorator
     * that contains the strategy and component to be used when decorating links.
     */
    static getDecorator() {
        return {
            strategy: LinkStrategy,
            component: (props) => {
                const {url} = Entity.get(props.entityKey).getData();

                return <a href={url} title={url}>{props.children}</a>;
            }
        };
    }

    constructor(props) {
        super(props);

        this.isContentSelected = this.isContentSelected.bind(this);
        this.showInput = this.showInput.bind(this);
        this.hideInput = this.hideInput.bind(this);
        this.applyLink = this.applyLink.bind(this);
        this.removeLink = this.removeLink.bind(this);

        this.state = {showInput: null};
    }

    /**
     * @ngdoc method
     * @name LinkControl#applyLink
     * @param {string} url The URL to apply
     * @param {Entity|null} entity The entity to apply the URL too.
     * @description Applies the given URL to the current content selection. If an
     * entity is specified, it applies the link to that entity instead.
     */
    applyLink(url, entity = null) {
        const {onChange, editorState} = this.props;

        if (entity) {
            const key = common.getSelectedEntityKey(editorState);

            return Entity.mergeData(key, {url});
        }

        const entityKey = Entity.create('LINK', 'MUTABLE', {url});
        const stateAfterChange = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );

        onChange(stateAfterChange);
    }

    /**
     * @ngdoc method
     * @name LinkControl#removeLink
     * @description Removes the link on the entire entity under the cursor.
     */
    removeLink() {
        const {editorState, onChange} = this.props;

        common.getSelectedEntityRange(editorState,
            (start, end) => {
                const selection = editorState.getSelection();
                const entitySelection = selection.merge({
                    anchorOffset: start,
                    focusOffset: end
                });

                const stateAfterChange = RichUtils.toggleLink(editorState, entitySelection, null);

                this.hideInput();
                onChange(stateAfterChange, true);
            }
        );
    }

    /**
     * @ngdoc method
     * @name LinkControl#showInput
     * @param {string=} url The URL to show in the input, when editing an already
     * existing link.
     * @description Shows the URL input box.
     */
    showInput(url = '') {
        const isNewLink = url === '';

        // only add new links if there is a selection
        if (isNewLink && !this.isContentSelected()) {
            return;
        }

        this.setState({showInput: url});
    }

    /**
     * @ngdoc method
     * @name LinkControl#hideInput
     * @description Hides the URL input.
     */
    hideInput() {
        this.setState({showInput: null});
    }

    /**
     * @ngdoc method
     * @name LinkControl#isContentSelected
     * @returns {boolean} True if content is selected in the editor.
     * @description Returns true if there is content selected in the editor.
     */
    isContentSelected() {
        const {editorState} = this.props;
        const selection = editorState.getSelection();

        return !selection.isCollapsed();
    }

    render() {
        const {editorState, editorOffset} = this.props;
        const entityType = common.getSelectedEntityType(editorState);
        const isEditing = typeof this.state.showInput === 'string';

        const cx = classNames({
            'link-button': true,
            inactive: !this.isContentSelected()
        });

        return (
            <div className="Editor3-styleButton">
                <span className={cx} onClick={this.showInput.bind(this, '')}>link</span>

                {entityType === 'LINK' ?
                    <LinkPopover
                        editorState={editorState}
                        editorOffset={editorOffset}
                        onEdit={this.showInput}
                        onRemove={this.removeLink} /> : null}

                {isEditing ?
                    <LinkInput
                        editorState={editorState}
                        onSubmit={this.applyLink}
                        onCancel={this.hideInput}
                        value={this.state.showInput} /> : null}
            </div>
        );
    }
}

function LinkStrategy(contentBlock, callback) {
    contentBlock.findEntityRanges(
        (character) => {
            const entityKey = character.getEntity();

            return entityKey !== null && Entity.get(entityKey).getType() === 'LINK';
        },
        callback
    );
}

LinkControl.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    editorOffset: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired
};
