import React from 'react';
import createEditorStore from './store';
import {Editor3} from './components';
import {Provider} from 'react-redux';
import ng from 'core/services/ng';
import {ContentState, RawDraftContentState, convertFromRaw, EditorState, convertToRaw} from 'draft-js';
import {setReadOnly, changeEditorState} from './actions/editor3';
import {isEqual} from 'lodash';

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

    rawDraftContentState: RawDraftContentState;

    onChange(contentState: RawDraftContentState): void;

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
 * @description Editor as a React component. Standalone means that it isn't connected to article item.
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

    constructor(props: IProps) {
        super(props);

        this.onChangeInterceptor = this.onChangeInterceptor.bind(this);

        const {
            disableSpellchecker,
            language,
            readOnly,
            singleLine,
            tabindex,
            showTitle,
            editorFormat,
        } = this.props;

        const store = createEditorStore(
            {
                disableSpellchecker,
                language,
                readOnly,
                singleLine,
                tabindex,
                showTitle,
                editorFormat,
                editorState: this.props.rawDraftContentState,
                onChange: this.onChangeInterceptor,
            },
            true,
        );

        if (props.findReplaceTarget) {
            ng.get('editor3').setStore(store);
        }

        this.store = store;
    }

    onChangeInterceptor(contentState: ContentState): void {
        // ensure that onChange value is of the same type as received from the props
        const rawState = convertToRaw(contentState);

        this.props.onChange(rawState);
    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.readOnly !== prevProps.readOnly) {
            this.store.dispatch(setReadOnly(this.props.readOnly));
        }

        const rawStateFromStore = convertToRaw(this.store.getState().editorState.getCurrentContent());

        if (isEqual(this.props.rawDraftContentState, rawStateFromStore) === false) {
            // This component holds it's own state which is derived from props
            // internal state is reloaded when it doesn't match with what's in the props
            this.store.dispatch(
                changeEditorState(EditorState.createWithContent(convertFromRaw(this.props.rawDraftContentState)), true),
            );
        }
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
