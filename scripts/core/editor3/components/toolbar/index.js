import React, {Component} from 'react';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import LinkControl from './LinkControl';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {Object} editorState the state of the editor
 * @param {Function} onChange on change function to be called when the editor
 * state changes
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
        const {editorState, editorFormat, onChange} = this.props;

        return (
            <div className="Editor3-controls">
                <BlockStyleControls
                    editorState={editorState}
                    options={editorFormat}
                    onChange={onChange}
                />

                <InlineStyleControls
                    editorState={editorState}
                    options={editorFormat}
                    onChange={onChange}
                />

                <LinkControl
                    editorState={editorState}
                    onChange={onChange}
                />
            </div>
        );
    }
}

Toolbar.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    editorFormat: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func.isRequired
};
