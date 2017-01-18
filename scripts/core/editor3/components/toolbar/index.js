import React, {Component} from 'react';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import LinkControl from './link-button/LinkControl';

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
    /**
     * @ngdoc method
     * @name Toolbar#getDecorators
     * @returns {Array} Array containing the decorators of the toolbar's components.
     * @static
     * @description Returns an array of decorators that need to be added to
     * the editor and are required by the toolbar.
     */
    static getDecorators() {
        return [
            LinkControl.getDecorator()
        ];
    }

    render() {
        const {editorRect} = this.props;

        return (
            <div className="Editor3-controls">
                <BlockStyleControls />
                <InlineStyleControls />
                <LinkControl editorRect={editorRect} />
            </div>
        );
    }
}

Toolbar.propTypes = {
    editorRect: React.PropTypes.object.isRequired
};
