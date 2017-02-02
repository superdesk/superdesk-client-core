import React from 'react';
import ReactDOM from 'react-dom';
import {Editor, CompositeDecorator} from 'draft-js';
import {connect} from 'react-redux';
import Toolbar from './toolbar';
import * as actions from '../actions';
import {SpellcheckerDecorator} from './spellchecker';
import {LinkDecorator} from './links';
import {blockRenderer} from './blockRenderer';
import {customStyleMap} from './customStyleMap';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Editor3
 * @param {Boolean} readOnly if true the editor is read only
 * @param {Boolean} showToolbar if true the editor will show the toolbar
 * @param {Boolean} singleLine if true the editor will have a single line
 * @param {editorState} the current state of draftjs editor
 * @param {Function} onChange the callback executed when the editor value is changed
 * @param {Function} onTab the callback for onTab event
 * @param {Function} handleKeyCommand the callback for custom key commands
 * @description Editor3 is a draft.js based editor that support customizable
 *  formatting, spellchecker and media files.
 */
export class Editor3Component extends React.Component {
    static getDecorator() {
        return new CompositeDecorator([
            LinkDecorator,
            SpellcheckerDecorator
        ]);
    }

    constructor(props) {
        super(props);

        this.editorRect = {top: 0, left: 0};

        this.focus = this.focus.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
    }

    /**
     * @ngdoc method
     * @name Editor3#focus
     * @description Handle the editor get focus event
     */
    focus() {
        this.refs.editor.focus();
    }

    /**
     * @ngdoc method
     * @name Editor3#onDragOver
     * @returns {Boolean} Returns true if the item is permitted.
     * @description Checks if the dragged over item is allowed.
     */
    onDragOver(e) {
        const mediaType = e.originalEvent.dataTransfer.types[0] || '';

        return [
            'application/superdesk.item.picture',
            'application/superdesk.item.graphic',
            'application/superdesk.item.video',
            'text/html',
        ].indexOf(mediaType) === -1;
    }

    /**
     * @ngdoc method
     * @name Editor3#componentWillUpdate
     * @description Called before update, init the current editor rectangle
     */
    componentWillUpdate() {
        this.editorRect = ReactDOM.findDOMNode(this.refs.editor).getBoundingClientRect();
    }

    componentDidMount() {
        const $node = $(ReactDOM.findDOMNode(this));

        $node.on('dragover', this.onDragOver);
        $node.on('drop dragdrop', this.props.dragDrop);
    }

    /**
     * @ngdoc method
     * @name Editor3#render
     * @param {String} command
     * @description Render the editor based on current state
     */
    render() {
        const {
            readOnly,
            showToolbar,
            singleLine,
            editorState,
            onChange,
            onTab,
            handleKeyCommand
        } = this.props;

        let className = singleLine ? 'Editor3-editor-single-line' : 'Editor3-editor';

        return (
            <div className="Editor3-root">
                {showToolbar ? <Toolbar editorRect={this.editorRect} /> : null}
                <div className={className} onClick={this.focus}>
                    <Editor
                        editorState={editorState}
                        handleKeyCommand={handleKeyCommand}
                        blockRendererFn={blockRenderer}
                        customStyleMap={customStyleMap}
                        onChange={onChange}
                        onTab={onTab}
                        readOnly={readOnly}
                        ref="editor"
                    />
                </div>
            </div>
        );
    }
}

/** Set the types of props for the editor */
Editor3Component.propTypes = {
    readOnly: React.PropTypes.bool,
    showToolbar: React.PropTypes.bool,
    singleLine: React.PropTypes.bool,
    editorState: React.PropTypes.object,
    onChange: React.PropTypes.func,
    onTab: React.PropTypes.func,
    dragDrop: React.PropTypes.func,
    handleKeyCommand: React.PropTypes.func
};

/**
 * @ngdoc method
 * @name Editor3#mapStateToProps
 * @param {Object} state the editor state
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component value type props.
 */
const mapStateToProps = (state) => ({
    readOnly: state.readOnly,
    showToolbar: state.showToolbar,
    singleLine: state.singleLine,
    editorState: state.editorState
});

/**
 * @ngdoc method
 * @name Editor3#mapDispatchToProps
 * @param {Function} dispatch callback to editor store
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component callback type props.
 */
const mapDispatchToProps = (dispatch) => ({
    onChange: (editorState) => dispatch(actions.changeEditorState(editorState)),
    onTab: (e) => dispatch(actions.handleEditorTab(e)),
    dragDrop: (e) => dispatch(actions.dragDrop(e)),
    handleKeyCommand: (command) => {
        // should return true if 'command' is in the list of custom commands(now no commands supported)
        dispatch(actions.handleEditorKeyCommand(command));
        return false;
    }
});

export const Editor3 = connect(mapStateToProps, mapDispatchToProps)(Editor3Component);
