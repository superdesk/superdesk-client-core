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

const EditorStore = React.createContext<Store>(null);

interface IValue {
    store: Store<IEditorStore>;
    contentState: ContentState;
}

type IProps = IEditorComponentProps<IValue, unknown>;

class Editor3Component extends React.PureComponent<IProps> {
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
     * TODO: add preview component and all missing data for store initialization.
     */
    const customFields: Array<ICustomFieldType<IValue, unknown, RawDraftContentState>> = [
        {
            id: 'editor3',
            label: gettext('Editor3 (authoring-react)'),
            editorComponent: Editor3Component,
            // previewComponent: Editor3Component
            previewComponent: () => null,

            fromStorageValue: (rawContentState, config, onChange) => {
                const store = createEditorStore(
                    {
                        editorState: rawContentState ?? convertToRaw(ContentState.createFromText('')),
                        onChange: (contentState: ContentState) => {
                            if (typeof onChange === 'function') {
                                onChange({store, contentState});
                            }
                        },
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
            toStorageValue: ({contentState}) => convertToRaw(contentState),
        },
    ];

    const result: IExtensionActivationResult = {
        contributions: {
            customFieldTypes: customFields,
        },
    };

    registerInternalExtension(editor3AuthoringReact, result);
}
