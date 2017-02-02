import React, {Component} from 'react';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import {LinkButton} from '../links';
import {ImageButton} from '../images';
import {EmbedButton} from '../embeds';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {Object} editorState The state of the editor.
 * @param {Object} editorRect Position of editor on the screen (top, left).
 * @param {Function} onChange On change function to be called when the editor
 * state changes.
 * @param {Array} editorFormat options and settings for formatting
 * @description Holds the editor's toolbar.
 */
export default class Toolbar extends Component {
    render() {
        const {editorRect} = this.props;

        return (
            <div className="Editor3-controls">
                <BlockStyleControls />
                <InlineStyleControls />
                <LinkButton editorRect={editorRect} />
                <ImageButton />
                <EmbedButton />
            </div>
        );
    }
}

Toolbar.propTypes = {
    editorRect: React.PropTypes.object.isRequired
};
