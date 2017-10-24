import React, {Component} from 'react';
import createEditorStore from './store';
import {Editor3} from './components';
import {Provider} from 'react-redux';
import {PropTypes} from 'prop-types';
import {ng} from 'core/services/ng';

/* eslint-disable react/no-unused-prop-types */

/**
 * @ngdoc React
 * @name Editor
 * @description A React component wrapping the editor.
 */
export class Editor extends Component {
    constructor(props) {
        super(props);

        const forReact = true;
        const store = createEditorStore(props, forReact);

        if (props.findReplaceTarget) {
            ng.get('editor3').setStore(store);
        }

        this.store = store;
    }

    render() {
        const {scrollContainer, singleLine} = this.props;

        return (
            <Provider store={this.store}>
                <Editor3 scrollContainer={scrollContainer} singleLine={singleLine} />
            </Provider>
        );
    }
}

Editor.defaultProps = {
    findReplaceTarget: false,
    highlights: false,
    editorFormat: [],
    html: '',
    readOnly: false,
    singleLine: false,
    onChangeDebounce: 100,
    disableSpellchecker: true,
    showTitle: false,
    tabindex: 0,
};

Editor.propTypes = {
    // If set, it will be used to make sure the toolbar is always
    // visible when scrolling. If not set, window object is used as reference.
    // Any valid jQuery selector will do.
    scrollContainer: PropTypes.string,

    // Whether this editor is the target for find & replace
    // operations. The Find & Replace service can only have one editor as
    // target.
    findReplaceTarget: PropTypes.bool,

    // If true, allows inline highlights (commenting, annotating, etc.).
    highlights: PropTypes.bool,

    // Editor format options that are enabled and should be displayed
    // in the toolbar.
    editorFormat: PropTypes.array,

    // A JSON object representing the initial Content State of the Draft editor.
    // It is transformed using `convertFromRaw` and its value is expected to be the
    // result of `converToRaw`.
    contentState: PropTypes.object,

    // HTML value of editor. If contentState is not set, this is used.
    html: PropTypes.string,

    // If true, editor is read-only.
    readOnly: PropTypes.bool,

    // Function that gets called on every content change. Receives editorState.
    onChange: PropTypes.func.isRequired,

    // Spellchecker's language.
    language: PropTypes.string,

    // If true, disables the spellchecker.
    disableSpellchecker: PropTypes.bool,

    // If true, editor is single-line.
    singleLine: PropTypes.bool,

    // If true, images may have an editable title.
    showTitle: PropTypes.bool,

    // Tab index
    tabindex: PropTypes.number,
};
