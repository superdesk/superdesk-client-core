import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import LinkControl from './link-button/LinkControl';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {Object} editorState The state of the editor.
 * @param {Object} editorOffset Position of editor on the screen (top, left).
 * @param {Function} onChange On change function to be called when the editor
 * state changes.
 * @param {Array} editorFormat options and settings for formatting
 * @description Holds the editor's toolbar.
 */
class ToolbarComponent extends Component {
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
        const {editorState, editorOffset, editorFormat, onChange} = this.props;

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
                    editorOffset={editorOffset}
                    onChange={onChange}
                />
            </div>
        );
    }
}

ToolbarComponent.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    editorOffset: React.PropTypes.object.isRequired,
    editorFormat: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func.isRequired
};

/**
 * @ngdoc method
 * @name Toolbar#mapDispatchToProps
 * @param {Function} dispatch callback to store
 * @param {Object} ownProps the component props
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component value type props.
 */
const mapStateToProps = (state, ownProps) => ({
    editorState: state.editorState,
    editorOffset: ownProps.editorOffset,
    editorFormat: state.editorFormat
});

/**
 * @ngdoc method
 * @name Toolbar#mapDispatchToProps
 * @param {Function} dispatch callback to store
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component callback type props.
 */
const mapDispatchToProps = (dispatch) => ({
    onChange: (editorState) => dispatch(actions.changeEditorState(editorState))
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;