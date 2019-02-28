import React from 'react';
import createEditorStore from './store';
import {Editor3} from './components';
import {Provider} from 'react-redux';
import ng from 'core/services/ng';
import {ContentState} from 'draft-js';

interface IProps {
    // If set, it will be used to make sure the toolbar is always
    // visible when scrolling. If not set, window object is used as reference.
    // Any valid jQuery selector will do.
    scrollContainer?: any;

    // Whether this editor is the target for find & replace
    // operations. The Find & Replace service can only have one editor as
    // target.
    findReplaceTarget: boolean;

    // If true, allows inline highlights (commenting, annotating, etc.).
    highlights: boolean;

    // Editor format options that are enabled and should be displayed
    // in the toolbar.
    editorFormat: Array<string>;

    // A JSON object representing the initial Content State of the Draft editor.
    // It is transformed using `convertFromRaw` and its value is expected to be the
    // result of `converToRaw`.
    editorState: any;

    // Function that gets called on every content change. Receives editorState.
    onChange(contentState: ContentState): void;

    // HTML value of editor. If contentState is not set, this is used.
    html: string;

    readOnly: boolean;
    singleLine: boolean;
    onChangeDebounce: 100;

    // Spellchecker's language.
    language?: string;

    disableSpellchecker: boolean;

    // If true, images may have an editable title.
    showTitle: boolean;
    tabindex: number;
}

/**
 * @ngdoc React
 * @name Editor
 * @description Editor as a React component.
 */
export class Editor3Standalone extends React.Component<IProps> {
    static defaultProps = {
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

    store: any;

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
