import React, {Component} from 'react';
import {LinkDecorator} from '../links/LinkDecorator';
import {getSelectedEntityType, getSelectedEntityRange} from '../links/entityUtils';
import {
    Editor,
    EditorState,
    ContentState,
    RichUtils,
    CompositeDecorator,
    getDefaultKeyBinding
} from 'draft-js';

export class TableCell extends Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.isSameState = this.isSameState.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.onClick = this.onClick.bind(this);
        this.keyBindingFn = this.keyBindingFn.bind(this);

        const decorator = new CompositeDecorator([LinkDecorator]);

        this.state = {
            editorState: props.contentState
                ? EditorState.createWithContent(props.contentState, decorator)
                : EditorState.createWithContent(ContentState.createFromText(''), decorator)
        };
    }

    keyBindingFn(e) {
        if (e.ctrlKey && e.key === 'l') {
            return 'toggle-link';
        }

        return getDefaultKeyBinding(e);
    }

    handleKeyCommand(command) {
        const {editorState} = this.state;
        let newState;

        if (command === 'toggle-link') {
            newState = getSelectedEntityType(this.state.editorState) === 'LINK'
                ? this.removeLink()
                : this.addLink();
        } else {
            newState = RichUtils.handleKeyCommand(editorState, command);
        }

        if (newState) {
            this.onChange(newState);
            return 'handled';
        }

        return 'not-handled';
    }

    addLink() {
        const {editorState} = this.state;

        // can't add a link if selection is collapsed
        if (editorState.getSelection().isCollapsed()) {
            return editorState;
        }

        // eslint-disable-next-line no-alert
        const url = prompt('Enter a URL');
        const contentState = editorState.getCurrentContent().createEntity('LINK', 'MUTABLE', {url});

        return RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            contentState.getLastCreatedEntityKey()
        );
    }

    removeLink() {
        const {editorState} = this.state;
        let stateAfterChange = editorState;

        getSelectedEntityRange(editorState,
            (start, end) => {
                const selection = editorState.getSelection();
                const entitySelection = selection.merge({
                    anchorOffset: start,
                    focusOffset: end
                });

                stateAfterChange = RichUtils.toggleLink(editorState, entitySelection, null);
            }
        );

        return stateAfterChange;
    }

    onChange(editorState) {
        if (this.isSameState(editorState, this.state.editorState)) {
            return;
        }

        this.setState({editorState});
        this.props.onChange(editorState);
    }

    onClick(e) {
        e.stopPropagation();
        this.props.onFocus();

        // after props.onFocus runs
        setTimeout(() => {
            this.refs.editor.focus();
            this.forceUpdate();
        }, 0);
    }

    isSameState(es1, es2) {
        return _.isEqual(es1.toJS(), es2.toJS());
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !this.isSameState(this.state.editorState, nextState.editorState);
    }

    render() {
        const {editorState} = this.state;

        return (
            <td onClick={this.onClick}>
                <Editor
                    editorState={editorState}
                    handleKeyCommand={this.handleKeyCommand}
                    onChange={this.onChange}
                    keyBindingFn={this.keyBindingFn}
                    ref="editor" />
            </td>
        );
    }
}

TableCell.propTypes = {
    contentState: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired,
    onFocus: React.PropTypes.func.isRequired
};
