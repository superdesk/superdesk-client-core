import React from 'react';
import ReactDOM from 'react-dom';
import {Editor, CompositeDecorator, RichUtils} from 'draft-js';
import {connect} from 'react-redux';
import Toolbar from './toolbar';
import * as actions from '../actions';
import {SpellcheckerDecorator} from './spellchecker';
import {LinkDecorator} from './links';
import {blockRenderer} from './blockRenderer';
import {customStyleMap} from './customStyleMap';
import classNames from 'classnames';
import {handlePastedText} from './handlePastedText';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Editor3
 * @param {Boolean} readOnly if true the editor is read only
 * @param {Boolean} showToolbar if true the editor will show the toolbar
 * @param {editorState} the current state of draftjs editor
 * @param {Function} onChange the callback executed when the editor value is changed
 * @param {Function} onTab the callback for onTab event
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
        this.readOnly = props.readOnly;
        this.scrollContainer = $(props.scrollContainer || window);
        this.state = {toolbarStyle: 'relative'};

        this.focus = this.focus.bind(this);
        this.onScroll = this.onScroll.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
    }

    /**
     * @ngdoc method
     * @name Editor3#focus
     * @description Handle the editor get focus event
     */
    focus() {
        this.props.unsetReadOnly(this.readOnly);
        setTimeout(this.refs.editor.focus, 0); // after action
    }

    /**
     * @ngdoc method
     * @name Editor3#onScroll
     * @description Triggered when the authoring page is scrolled. It adjusts toolbar
     * style, based on the location of the editor within the scroll container.
     */
    onScroll(e) {
        const editorRect = ReactDOM.findDOMNode(this.refs.editor).getBoundingClientRect();
        const pageRect = this.scrollContainer[0].getBoundingClientRect();

        if (!editorRect || !pageRect) {
            return;
        }

        const toolbarStyle = editorRect.top < pageRect.top + 50 ? 'fixed' : 'relative';

        if (toolbarStyle !== this.state.toolbarStyle) {
            this.setState({toolbarStyle});
        }
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
     * @name Editor3#handleKeyCommand
     * @description Handles key commands in the editor.
     */
    handleKeyCommand(command) {
        const {editorState, onChange} = this.props;
        const newState = RichUtils.handleKeyCommand(editorState, command);

        if (newState) {
            onChange(newState);
            return 'handled';
        }

        return 'not-handled';
    }

    componentWillUpdate() {
        this.editorRect = ReactDOM.findDOMNode(this.refs.editor).getBoundingClientRect();
    }

    componentDidMount() {
        const $node = $(ReactDOM.findDOMNode(this));

        $node.on('dragover', this.onDragOver);
        $node.on('drop dragdrop', this.props.dragDrop);

        if (this.props.showToolbar) {
            this.scrollContainer.on('scroll', this.onScroll);
        }
    }

    componentWillUnmount() {
        this.scrollContainer.off('scroll', this.onScroll);
    }

    render() {
        const {toolbarStyle} = this.state;
        const {
            readOnly,
            showToolbar,
            editorState,
            onChange,
            onTab
        } = this.props;

        let cx = classNames({
            'Editor3-root Editor3-editor': true,
            'floating-toolbar': toolbarStyle === 'fixed',
            'read-only': readOnly
        });

        return (
            <div className={cx}>
                {showToolbar ? <Toolbar editorRect={this.editorRect} disabled={readOnly} /> : null}
                <div className="focus-screen" onClick={this.focus}>
                    <Editor
                        editorState={editorState}
                        handleKeyCommand={this.handleKeyCommand}
                        blockRendererFn={blockRenderer}
                        customStyleMap={customStyleMap}
                        onChange={onChange}
                        onTab={onTab}
                        handlePastedText={handlePastedText.bind(this)}
                        readOnly={readOnly}
                        ref="editor"
                    />
                </div>
            </div>
        );
    }
}

Editor3Component.propTypes = {
    readOnly: React.PropTypes.bool,
    showToolbar: React.PropTypes.bool,
    editorState: React.PropTypes.object,
    onChange: React.PropTypes.func,
    unsetReadOnly: React.PropTypes.func,
    onTab: React.PropTypes.func,
    dragDrop: React.PropTypes.func,
    scrollContainer: React.PropTypes.object
};

const mapStateToProps = (state) => ({
    readOnly: state.readOnly,
    showToolbar: state.showToolbar,
    editorState: state.editorState
});

const mapDispatchToProps = (dispatch) => ({
    onChange: (editorState) => dispatch(actions.changeEditorState(editorState)),
    onTab: (e) => dispatch(actions.handleEditorTab(e)),
    dragDrop: (e) => dispatch(actions.dragDrop(e)),
    unsetReadOnly: () => dispatch(actions.setReadOnly(false))
});

export const Editor3 = connect(mapStateToProps, mapDispatchToProps)(Editor3Component);
