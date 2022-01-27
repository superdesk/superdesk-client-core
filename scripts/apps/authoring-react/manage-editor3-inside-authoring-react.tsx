/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import {registerInternalExtension} from 'core/helpers/register-internal-extension';
import {
    IExtensionActivationResult,
    IEditorComponentProps,
    ICustomFieldType,
    IConfigComponentProps,
    RICH_FORMATTING_OPTION,
    IArticle,
} from 'superdesk-api';
import {gettext, gettextPlural} from 'core/utils';
import {convertToRaw, ContentState} from 'draft-js';
import createEditorStore, {
    IEditorStore,
    initializeSpellchecker,
    getInitialSpellcheckerData,
    prepareEditor3StateForExport,
    getAnnotationsForField,
} from 'core/editor3/store';
import ng from 'core/services/ng';
import {Provider} from 'react-redux';
import {Store} from 'redux';
import {Editor3} from 'core/editor3/components';
import {noop} from 'lodash';
import {EDITOR3_RICH_FORMATTING_OPTIONS} from 'apps/workspace/content/components/get-content-profiles-form-config';
import {MultiSelect} from 'core/ui/components/MultiSelect';
import {setExternalOptions, EditorLimit} from 'core/editor3/actions';
import {Checkbox} from 'superdesk-ui-framework/react';
import {ReactContextForEditor3} from 'core/editor3/directive';
import {
    DEFAULT_UI_FOR_EDITOR_LIMIT,
    CharacterLimitUiBehavior,
    CharacterCountConfigModal,
} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {CharacterCount2} from 'apps/authoring/authoring/components/CharacterCount';
import {showModal} from 'core/services/modalService';
import {countWords} from 'core/count-words';
import {getReadingTimeText} from 'apps/authoring/authoring/directives/ReadingTime';
import {CONTENT_FIELDS_DEFAULTS} from 'apps/authoring/authoring/helpers';
import {editor3StateToHtml} from 'core/editor3/html/to-html/editor3StateToHtml';

interface IEditor3Config {
    editorFormat?: Array<RICH_FORMATTING_OPTION>;
    minLength?: number;
    maxLength?: number;
    plainText?: boolean;
    cleanPastedHtml?: boolean;
}

interface IValue {
    store: Store<IEditorStore>;
    contentState: ContentState;
}

interface IUserPreferences {
    characterLimitMode?: CharacterLimitUiBehavior;
}

type IProps = IEditorComponentProps<IValue, IEditor3Config, IUserPreferences>;

interface IState {
    /**
     * Wait until redux store is fully initialized before rendering the editor.
     * Initial spellchecking is done on `componentDidMount` and wouldn't work otherwise.
     */
    ready: boolean;
}

class Editor3Component extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            ready: false,
        };

        this.getCharacterLimitPreference = this.getCharacterLimitPreference.bind(this);
    }

    getCharacterLimitPreference(): EditorLimit | null {
        if (typeof this.props.config.maxLength !== 'number') {
            return null;
        }

        return {
            ui: this.props.userPreferences.characterLimitMode ?? DEFAULT_UI_FOR_EDITOR_LIMIT,
            chars: this.props.config.maxLength,
        };
    }

    syncPropsWithReduxStore() {
        const store = this.props.value.store;
        const spellcheck = ng.get('spellcheck');

        store.dispatch(setExternalOptions({
            editorFormat: this.props.config.editorFormat ?? [],
            singleLine: this.props.config.plainText ?? false,
            readOnly: this.props.readOnly ?? false,
            spellchecking: getInitialSpellcheckerData(spellcheck, this.props.language),
            limitConfig: this.getCharacterLimitPreference(),
            item: {
                language: this.props.language, // required for annotations to work
            },
        }));
    }

    componentDidMount() {
        const store = this.props.value.store;

        store.subscribe(() => {
            const contentState = store.getState().editorState.getCurrentContent();

            if (this.props.value.contentState !== contentState) {
                this.props.onChange({store, contentState});
            }
        });

        const spellcheck = ng.get('spellcheck');

        spellcheck.getDictionary(this.props.language).then((dict) => {
            spellcheck.isActiveDictionary = !!dict.length;
            spellcheck.setLanguage(this.props.language);
            spellcheck.setSpellcheckerStatus(true);

            this.syncPropsWithReduxStore();

            initializeSpellchecker(store, spellcheck).then(() => {
                this.setState({ready: true});
            });
        });
    }

    componentDidUpdate(prevProps: IProps) {
        if (
            this.props.config !== prevProps.config
            || this.props.readOnly !== prevProps.readOnly
            || this.props.userPreferences !== prevProps.userPreferences
            || this.props.language !== prevProps.language
        ) {
            this.syncPropsWithReduxStore();
        }
    }

    render() {
        if (this.state.ready !== true) {
            return null;
        }

        const store = this.props.value.store;
        const {config} = this.props;
        const characterLimitConfig = this.getCharacterLimitPreference();
        const plainText = this.props.value.contentState.getPlainText();
        const wordCount = countWords(plainText);
        const readingTime: string = getReadingTimeText(plainText, this.props.language);

        return (
            <Provider store={store}>
                <ReactContextForEditor3.Provider value={store}>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'end'}}>
                        {
                            typeof this.props.config.maxLength === 'number' && (
                                <div style={{display: 'flex', gap: '6px'}}>
                                    <span className="char-count-base">
                                        {gettextPlural(wordCount, 'one word', '{{x}} words', {x: wordCount})}
                                    </span>

                                    <CharacterCount2
                                        limit={this.props.config.maxLength}
                                        html={false}
                                        item={this.props.value.contentState.getPlainText()}
                                    />

                                    <span className="char-count-base">{readingTime}</span>
                                </div>
                            )
                        }

                        {
                            characterLimitConfig != null && (
                                <div>
                                    <button
                                        onClick={() => {
                                            showModal(({closeModal}) => (
                                                <CharacterCountConfigModal
                                                    closeModal={closeModal}
                                                    value={characterLimitConfig.ui}
                                                    onChange={(ui) => {
                                                        this.props.onUserPreferencesChange({
                                                            ...characterLimitConfig,
                                                            characterLimitMode: ui,
                                                        });
                                                    }}
                                                />
                                            ));
                                        }}
                                    >
                                        <i className="icon-settings" />
                                    </button>
                                </div>
                            )
                        }
                    </div>

                    <Editor3
                        scrollContainer="window"
                        singleLine={config.plainText ?? false}
                        cleanPastedHtml={config.cleanPastedHtml ?? false}
                        autocompleteSuggestions={undefined}
                    />
                </ReactContextForEditor3.Provider>
            </Provider>
        );
    }
}

class Editor3ConfigComponent extends React.PureComponent<IConfigComponentProps<IEditor3Config>> {
    render() {
        return (
            <div>
                <div>{gettext('Formatting options')}</div>
                <MultiSelect
                    items={EDITOR3_RICH_FORMATTING_OPTIONS.map((label) => ({id: label, label}))}
                    values={this.props.config?.editorFormat ?? []}
                    onChange={(editorFormat: Array<RICH_FORMATTING_OPTION>) => {
                        this.props.onChange({...this.props.config, editorFormat});
                    }}
                />

                <br />

                <div>{gettext('Minimum length')}</div>

                <input
                    type="number"
                    value={this.props.config.minLength}
                    onChange={(event) => {
                        this.props.onChange({...this.props.config, minLength: parseInt(event.target.value, 10)});
                    }}
                />

                <br />

                <div>{gettext('Maximum length')}</div>

                <input
                    type="number"
                    value={this.props.config.maxLength}
                    onChange={(event) => {
                        this.props.onChange({...this.props.config, maxLength: parseInt(event.target.value, 10)});
                    }}
                />

                <br />

                <Checkbox
                    label={{text: gettext('Single line')}}
                    checked={this.props.config?.plainText ?? false}
                    onChange={(val) => {
                        this.props.onChange({...this.props.config, plainText: val});
                    }}
                />

                <br />

                <Checkbox
                    label={{text: gettext('Clean pasted HTML')}}
                    checked={this.props.config?.cleanPastedHtml ?? false}
                    onChange={(val) => {
                        this.props.onChange({...this.props.config, cleanPastedHtml: val});
                    }}
                />
            </div>
        );
    }
}

const editor3AuthoringReact = 'editor3--authoring-react';

export function registerEditor3AsCustomField() {
    const customFields: Array<ICustomFieldType<IValue, IEditor3Config, IUserPreferences>> = [
        {
            id: 'editor3',
            label: gettext('Editor3 (authoring-react)'),
            editorComponent: Editor3Component,
            previewComponent: Editor3Component,
            configComponent: Editor3ConfigComponent,

            retrieveStoredValue: (fieldId, article) => {
                const rawContentState = article.fields_meta?.[fieldId]?.['draftjsState'][0];

                const store = createEditorStore(
                    {
                        editorState: rawContentState ?? convertToRaw(ContentState.createFromText('')),
                        onChange: noop,
                    },
                    ng.get('spellcheck'),
                    true,
                );

                return {
                    store,
                    contentState: store.getState().editorState.getCurrentContent(),
                };
            },

            storeValue: (fieldId, article, value, config) => {
                const contentState = prepareEditor3StateForExport(
                    value.store.getState().editorState.getCurrentContent(),
                );
                const rawContentState = convertToRaw(contentState);

                const generatedValue = (() => {
                    if (config.plainText) {
                        return contentState.getPlainText();
                    } else {
                        return editor3StateToHtml(contentState);
                    }
                })();

                const annotations = getAnnotationsForField(article, fieldId);

                const articleUpdated: IArticle = {
                    ...article,
                    fields_meta: {
                        ...(article.fields_meta ?? {}),
                        [fieldId]: {
                            draftjsState: [rawContentState],
                            annotations: annotations,
                        },
                    },
                };

                /**
                 * Output generated value to hardcoded fields
                 */
                if (CONTENT_FIELDS_DEFAULTS[fieldId] != null) {
                    articleUpdated[fieldId] = generatedValue;
                }

                // keep compatibility with existing output format
                if (fieldId === 'body_html') {
                    articleUpdated.annotations = annotations;
                }

                return articleUpdated;
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
