import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import {Editor, EditorState, RichUtils, CompositeDecorator} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';
import {stateFromHTML} from 'draft-js-import-html';
import Toolbar from './toolbar';
import EditorEvents from '../services/EditorEvents';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Editor3
 * @param {Array} editorFormat the formating settings available for editor,
    the allowed values are declared on BLOCK_TYPES_STYLE and INLINE_STYLES
 * @param {Boolean} readOnly if true the editor is read only
 * @param {Boolean} showToolbar if true the editor will show the toolbar
 * @param {String} value the model for editor value
 * @param {String} language the current language used for spellchecker
 * @param {Function} onChange the callback executed when the editor value is changed
 * @description Editor3 is a draft.js based editor that support customizable
 *  formatting (shortly more features will come ...)
 */
export class Editor3 extends React.Component {
    constructor(props) {
        super(props);

        const initialContentState = stateFromHTML(props.value);

        this.state = {
            editorState: EditorState.createWithContent(
                initialContentState,
                this.getDecorators()
            )
        };

        this.offset = {top: 0, left: 0}; // editor absolute position on screen

        this.focus = this.focus.bind(this);
        this.onChange = this.onChange.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.onTab = this.onTab.bind(this);
        this.getDecorators = this.getDecorators.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
    }

    /**
     * @ngdoc method
     * @name Editor3#onContextMenu
     * @description Called when the editor receives the onContextMenu event. It
     * triggers all listeners in EditorEvents.
     */
    onContextMenu(e) {
        EditorEvents.triggerRightClick({
            event: e,
            editorState: this.state.editorState,
            onChange: this.onChange
        });
    }

    /**
     * @ngdoc method
     * @name Editor3#getDecorators
     * @returns {Object} CompositeDecorator
     * @description Returns the CompositeDecorator that contains the editor's decorators.
     * It should return an array containing all of the decorators used by sub-components
     * such as the toolbar, spellcheckers, etc.
     */
    getDecorators() {
        return new CompositeDecorator(Toolbar.getDecorators());
    }

    /** Handle the editor get focus event */
    focus() {
        this.refs.editor.focus();
    }

    /** Handle the editor state has been changed event*/
    onChange(editorState, focus = false) {
        this.setState({editorState}, () => {
            if (focus) {
                this.focus();
            }
        });

        this.props.onChange(stateToHTML(editorState.getCurrentContent()));
    }

    /** Handle the editor key pressed event */
    handleKeyCommand(command) {
        const {editorState} = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);

        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    /** Handle the editor tab key pressed event */
    onTab(e) {
        const maxDepth = 4;

        this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
    }

    componentWillUpdate() {
        const node = ReactDOM.findDOMNode(this);

        this.offset = $(node).offset();
    }

    /** Render the editor based on current state */
    render() {
        const {editorState} = this.state;
        const {showToolbar, readOnly, editorFormat} = this.props;

        // If the user changes block type before entering any text, we can
        // either style the placeholder or hide it. Let's just hide it now.
        let className = 'Editor3-editor';
        var contentState = editorState.getCurrentContent();

        if (!contentState.hasText()) {
            if (contentState.getBlockMap()
                .first()
                .getType() !== 'unstyled') {
                className += ' Editor3-hidePlaceholder';
            }
        }

        const editor = () =>
            <div onContextMenu={this.onContextMenu}>
                <Editor
                    editorState={editorState}
                    handleKeyCommand={this.handleKeyCommand}
                    onChange={this.onChange}
                    onTab={this.onTab}
                    readOnly={readOnly}
                    ref="editor"
                />
            </div>;

        if (showToolbar) {
            return (
                <div className="Editor3-root">
                    <Toolbar
                        editorState={editorState}
                        editorFormat={editorFormat}
                        editorOffset={this.offset}
                        onChange={this.onChange}
                    />

                    <div className={className} onClick={this.focus}>{editor()}</div>
                </div>
            );
        }

        return (
            <div onClick={this.focus} className="Editor3-editor-single-line">
                {editor()}
            </div>
        );
    }
}

/** Set the types of props for the editor */
Editor3.propTypes = {
    editorFormat: React.PropTypes.array,
    readOnly: React.PropTypes.bool,
    showToolbar: React.PropTypes.bool,
    value: React.PropTypes.string,
    onChange: React.PropTypes.func
};

/** Set the default values of props for the editor */
Editor3.defaultProps = {
    editorFormat: [],
    readOnly: false,
    showToolbar: true,
    value: '',
    language: 'en'
};
