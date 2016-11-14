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
 * @description Editor3 is a draft.js based editor that support customizable formatting (shortly more features will come ...)
 */
import React from 'react';
import ReactDOM from 'react-dom';
import {Editor, EditorState, RichUtils, ContentState} from 'draft-js';

export class Editor3 extends React.Component {
    constructor(props) {
        super(props);
        var initialContentState = ContentState.createFromText(props.value);
        this.state = {editorState: EditorState.createWithContent(initialContentState)};

        this.readOnly = props.readOnly || false;
        this.showToolbar = props.showToolbar || false;
        this.editorFormat = props.editorFormat || [];
        this.parentOnChange = props.onChange;

        this.focus = this.focus.bind(this);
        this.onChange = this.onChange.bind(this);

        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.onTab = this.onTab.bind(this);
        this.toggleBlockType = this.toggleBlockType.bind(this);
        this.toggleInlineStyle = this.toggleInlineStyle.bind(this);
    }


    /** Handle the editor get focus event */
    focus() {
        this.refs.editor.focus();
    }

    /** Handle the editor state has been changed event*/
    onChange(editorState) {
        this.setState({editorState});
        this.parentOnChange(editorState.getCurrentContent().getPlainText());
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

    /** Handle the toolbar button pressed event */
    toggleBlockType(blockType) {
        this.onChange(
            RichUtils.toggleBlockType(
                this.state.editorState,
                blockType
            )
        );
    }

    /** Handle the toolbar button pressed event */
    toggleInlineStyle(inlineStyle) {
        this.onChange(
            RichUtils.toggleInlineStyle(
                this.state.editorState,
                inlineStyle
            )
        );
    }

    /** Render the editor based on current state */
    render() {
        const {editorState} = this.state;

        // If the user changes block type before entering any text, we can
        // either style the placeholder or hide it. Let's just hide it now.
        let className = 'Editor3-editor';
        var contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== 'unstyled') {
                className += ' Editor3-hidePlaceholder';
            }
        }

        if (this.showToolbar) {
            return (
                <div className="Editor3-root">
                    <div className="Editor3-controls">
                        <BlockStyleControls
                            editorState={editorState}
                            options={this.editorFormat}
                            onToggle={this.toggleBlockType}
                        />
                        <InlineStyleControls
                            editorState={editorState}
                            options={this.editorFormat}
                            onToggle={this.toggleInlineStyle}
                        />
                    </div>
                    <div className={className} onClick={this.focus}>
                        <Editor
                            editorState={editorState}
                            handleKeyCommand={this.handleKeyCommand}
                            onChange={this.onChange}
                            onTab={this.onTab}
                            readOnly={this.readOnly}
                            ref="editor"
                        />
                    </div>
                </div>
            );
        } else {
                return (
                    <div onClick={this.focus} className="Editor3-editor-single-line">
                        <Editor
                            editorState={editorState}
                            handleKeyCommand={this.handleKeyCommand}
                            onChange={this.onChange}
                            onTab={this.onTab}
                            readOnly={this.readOnly}
                            ref="editor"
                        />
                    </div>
            );
        }
    }
}

/** Set the types of props for the editor */
Editor3.propTypes = {
    editorFormat: React.PropTypes.array,
    readOnly: React.PropTypes.bool,
    showToolbar: React.PropTypes.bool,
    value: React.PropTypes.string,
    language: React.PropTypes.string,
    onChange: React.PropTypes.func
}

/** Set the default values of props for the editor */
Editor3.defaultProps = {
    editorFormat: [],
    readOnly: false,
    showToolbar: true,
    value: '',
    language: 'en'
};

/** Toolbar button component */
class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = (e) => {
            e.preventDefault();
            this.props.onToggle(this.props.style);
        };
    }

    render() {
        let className = 'Editor3-styleButton';
        if (this.props.active) {
            className += ' Editor3-activeButton';
        }

        return (
            <span className={className} onMouseDown={this.onToggle}>
                {this.props.label}
            </span>
        );
    }
}

/** The list of supported block types style */
const BLOCK_TYPES_STYLE = {
    'h1': 'header-one',
    'h2': 'header-two',
    'h3': 'header-three',
    'h4': 'header-four',
    'h5': 'header-five',
    'h6': 'header-six',
    'quote': 'blockquote',
    'ul': 'unordered-list-item',
    'ol': 'ordered-list-item'
};

/** Block style functional component, will manage the block related toolbar buttons */
const BlockStyleControls = (props) => {
    const {editorState, options} = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    return (
        <span>
            {options.filter(type => type in BLOCK_TYPES_STYLE).map((type) =>
                <StyleButton
                    key={type}
                    active={BLOCK_TYPES_STYLE[type] === blockType}
                    label={type}
                    onToggle={props.onToggle}
                    style={BLOCK_TYPES_STYLE[type]}
                />
            )}
        </span>
    );
};

/** The list of supported inline styles */
var INLINE_STYLES = {
    'bold': 'BOLD',
    'italic': 'ITALIC',
    'underline': 'UNDERLINE'
};

/** Inline style functional component, will manage the inline style related toolbar buttons */
const InlineStyleControls = (props) => {
    var currentStyle = props.editorState.getCurrentInlineStyle();
    const {options} = props;
    return (
        <span>
            {options.filter(type => type in INLINE_STYLES).map(type =>
                <StyleButton
                    key={type}
                    active={currentStyle.has(INLINE_STYLES[type])}
                    label={type}
                    onToggle={props.onToggle}
                    style={INLINE_STYLES[type]}
                />
            )}
        </span>
    );
};
