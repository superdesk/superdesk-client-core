import React from 'react';
import ReactDOM from 'react-dom';
import {Editor, EditorState, RichUtils, CompositeDecorator} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';
import {stateFromHTML} from 'draft-js-import-html';
import Toolbar from './toolbar';
import {Spellchecker} from './spellchecker';

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

        this.focus = this.focus.bind(this);
        this.onChange = this.onChange.bind(this);

        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.onTab = this.onTab.bind(this);

        this.getDecorators = this.getDecorators.bind(this);
        this.getEditorState = this.getEditorState.bind(this);
        this.setEditorState = this.setEditorState.bind(this);

        this.state = {
            editorState: EditorState.createWithContent(
                initialContentState,
                this.getDecorators()
            )
        };
    }

    /**
     * @ngdoc method
     * @name Editor3#getEditorState
     * @returns {Object}
     * @description Returns the current state of the editor
     */
    getEditorState() {
        return this.state;
    }

    /**
     * @ngdoc method
     * @name Editor3#setEditorState
     * @param {Object} state
     * @description Set a new state for editor
     */
    setEditorState(state) {
        setTimeout(() => {
            this.setState(state);
        }, 0);
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
        var decorators = Spellchecker.getDecorators(
            this.getEditorState, this.setEditorState, this.props.spellchecker);

        return new CompositeDecorator(decorators.concat(Toolbar.getDecorators()));
    }

    /**
     * @ngdoc method
     * @name Editor3#onChange
     * @param {Object} editorState
     * @description Handle the editor state has been changed event
     */
    onChange(editorState) {
        this.setState({editorState});
        this.props.onChange(stateToHTML(editorState.getCurrentContent()));
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
     * @name Editor3#onTab
     * @param {Object} event
     * @description Handle the editor tab key pressed event
     */
    onTab(e) {
        const maxDepth = 4;

        this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
    }

    /**
     * @ngdoc method
     * @name Editor3#handleKeyCommand
     * @param {String} command
     * @description Handle the editor key pressed event
     */
    handleKeyCommand(command) {
        const {editorState} = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);

        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    /**
     * @ngdoc method
     * @name Editor3#componentWillUpdate
     * @description Called before update, init the current editor rectangle
     */
    componentWillUpdate() {
        this.editorRect = ReactDOM.findDOMNode(this.refs.editor).getBoundingClientRect();
    }

    /**
     * @ngdoc method
     * @name Editor3#render
     * @param {String} command
     * @description Render the editor based on current state
     */
    render() {
        const {editorState} = this.state;

        let className = 'Editor3-editor dropdown';
        var contentState = editorState.getCurrentContent();

        if (!contentState.hasText()) {
            if (contentState.getBlockMap()
                .first()
                .getType() !== 'unstyled') {
                className += ' Editor3-hidePlaceholder';
            }
        }

        const editor = () =>
            <Editor
                editorState={editorState}
                handleKeyCommand={this.handleKeyCommand}
                onChange={this.onChange}
                onTab={this.onTab}
                readOnly={this.props.readOnly}
                ref="editor"
            />;

        const spellchecker = () =>
            <Spellchecker
                getEditorState={this.getEditorState}
                setEditorState={this.setEditorState}
                spellchecker={this.props.spellchecker}
                editorRect={this.editorRect}
            />;

        if (this.props.showToolbar) {
            return (
                <div className="Editor3-root">
                    <Toolbar
                        editorState={editorState}
                        editorFormat={this.props.editorFormat}
                        onChange={this.onChange}
                    />
                    <div className={className} onClick={this.focus}>{spellchecker()}{editor()}</div>
                </div>
            );
        }

        return (
            <div onClick={this.focus} className="Editor3-editor-single-line">
                {spellchecker()}{editor()}
            </div>
        );
    }
}

/** Set the types of props for the editor */
Editor3.propTypes = {
    readOnly: React.PropTypes.bool,
    showToolbar: React.PropTypes.bool,
    editorFormat: React.PropTypes.array,
    onChange: React.PropTypes.func,
    value: React.PropTypes.string,
    spellchecker: React.PropTypes.object
};

/** Set the default values of props for the editor */
Editor3.defaultProps = {
    readOnly: false,
    showToolbar: true,
    editorFormat: [],
    onChange: (text) => text,
    value: ''
};
