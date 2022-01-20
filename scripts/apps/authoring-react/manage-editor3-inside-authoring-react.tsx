import * as React from 'react';
import {registerInternalExtension} from 'core/helpers/register-internal-extension';
import {
    IExtensionActivationResult,
    IEditorComponentProps,
    ICustomFieldType,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {RawDraftContentState, convertToRaw, ContentState} from 'draft-js';
import createEditorStore, {IEditorStore} from 'core/editor3/store';
import ng from 'core/services/ng';
import {Provider} from 'react-redux';
import {Store} from 'redux';
import {Editor3} from 'core/editor3/components';
import {noop} from 'lodash';

const EditorStore = React.createContext<Store>(null);

interface IValue {
    store: Store<IEditorStore>;
    contentState: ContentState;
}

type IProps = IEditorComponentProps<IValue, unknown>;

class Editor3Component extends React.PureComponent<IProps> {
    componentDidMount() {
        const store = this.props.value.store;

        store.subscribe(() => {
            const contentState = store.getState().editorState.getCurrentContent();

            if (this.props.value.contentState !== contentState) {
                this.props.setValue({store, contentState});
            }
        });
    }

    render() {
        const store = this.props.value.store;

        /**
         * TODO: get configs from content profile and pass them as props
         */

        return (
            <Provider store={store}>
                <EditorStore.Provider value={store}>
                    <Editor3
                        scrollContainer="window"
                        singleLine={false}
                        cleanPastedHtml={false}
                        autocompleteSuggestions={undefined}
                    />
                </EditorStore.Provider>
            </Provider>
        );
    }
}

const editor3AuthoringReact = 'editor3--authoring-react';

export function registerEditor3AsCustomField() {
    /**
     * TODO: add missing data for store initialization.
     */
    const customFields: Array<ICustomFieldType<IValue, unknown, RawDraftContentState>> = [
        {
            id: 'editor3',
            label: gettext('Editor3 (authoring-react)'),
            editorComponent: Editor3Component,
            previewComponent: Editor3Component,

            retrieveStoredValue: (fieldId, article) => {
                const rawContentState = article.fields_meta?.[fieldId]?.['draftjsState'][0];

                const store = createEditorStore(
                    {
                        editorState: rawContentState ?? convertToRaw(ContentState.createFromText('')),
                        onChange: noop,
                        editorFormat: ['bold', 'comments', 'annotation'],
                        // language
                        // debounce
                        // onChange
                        // readOnly
                        // singleLine
                        // tabindex
                        // showTitle
                        // item
                        // svc
                        // trim
                        // value
                        // limitBehavior
                        // limit
                    },
                    ng.get('spellcheck'),
                    true,
                );

                return {
                    store,
                    contentState: store.getState().editorState.getCurrentContent(),
                };
            },

            storeValue: (fieldId, article, value) => {
                const rawContentState = convertToRaw(
                    value.store.getState().editorState.getCurrentContent(),
                );

                return {
                    ...article,
                    fields_meta: {
                        ...(article.fields_meta ?? {}),
                        [fieldId]: {
                            draftjsState: [rawContentState],
                        },
                    },
                };

                // TODO: update HTML too
            },
        },
    ];

    const result: IExtensionActivationResult = {
        contributions: {
            customFieldTypes: customFields,
        },
    };

    registerInternalExtension(editor3AuthoringReact, result);
}
