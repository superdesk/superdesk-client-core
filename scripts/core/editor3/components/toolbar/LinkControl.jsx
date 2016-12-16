import React, {Component} from 'react';
import {RichUtils, Entity} from 'draft-js';
import classNames from 'classnames';
import LinkPopover from './LinkPopover';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkControl
 * @param {Object} editorState the state of the editor
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
            component: LinkControl.LinkComponent
        };
    }

    /**
     * @ngdoc method
     * @name LinkControl#LinkComponent
     * @returns {JSX}
     * @static
     * @description Contains the link component used to decorate links
     */
    static LinkComponent(props) {
        const {url} = Entity.get(props.entityKey).getData();

        return <a href={url} title={url}>{props.children}</a>;
    }

    constructor(props) {
        super(props);

        this.isContentSelected = this.isContentSelected.bind(this);
        this.onClick = this.onClick.bind(this);
        this.applyLinkToSelection = this.applyLinkToSelection.bind(this);
    }

    /**
     * @ngdoc method
     * @name LinkControl#applyLinkToSelection
     * @param {string} url The URL to apply
     * @description Applies the given URL to the current content selection.
     */
    applyLinkToSelection(url) {
        const {onChange, editorState} = this.props;

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
     * @name LinkControl#onClick
     * @description Handles the toolbar button click event.
     */
    onClick() {
        if (!this.isContentSelected()) {
            return;
        }

        // TODO(gbbr): implement a reusable pop-up as pare of core
        // eslint-disable-next-line no-alert
        const url = prompt('Enter a URL');

        if (url) {
            this.applyLinkToSelection(url);
        }
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
        const isContentSelected = this.isContentSelected();
        const {editorState, onChange} = this.props;

        const cx = classNames({
            'link-button': true,
            inactive: !isContentSelected
        });

        return (
            <div className="Editor3-styleButton">
                <span className={cx} onClick={this.onClick}>link</span>
                <LinkPopover editorState={editorState} onChange={onChange} />
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
    onChange: React.PropTypes.func.isRequired
};
