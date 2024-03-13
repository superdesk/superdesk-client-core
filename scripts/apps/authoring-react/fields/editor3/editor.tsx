import * as React from 'react';
import {
    IEditorComponentProps,
    IEditor3ValueOperational,
    IEditor3Config,
} from 'superdesk-api';
import {gettextPlural} from 'core/utils';
import {
    initializeSpellchecker,
    getInitialSpellcheckerData,
} from 'core/editor3/store';
import ng from 'core/services/ng';
import {Provider} from 'react-redux';
import {Editor3} from 'core/editor3/components';
import {
    setExternalOptions,
    EditorLimit,
    setHighlightCriteria,
    findPrev,
    findNext,
    replace,
    replaceAll,
    setSpellcheckerStatus,
    changeLimitConfig,
    multiReplace,
    patchHTMLonEditorState,
    setEditorStateFromItem,
    changeEditorState,
} from 'core/editor3/actions';
import {ReactContextForEditor3} from 'core/editor3/directive';
import {
    DEFAULT_UI_FOR_EDITOR_LIMIT,
    CharacterLimitUiBehavior,
    CharacterCountConfigModal,
} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {showModal} from '@superdesk/common';
import {addEditorEventListener, dispatchEditorEvent} from '../../authoring-react-editor-events';
import {getAutocompleteSuggestions} from 'core/helpers/editor';
import {EditorState} from 'draft-js';
import {Select, Option} from 'superdesk-ui-framework/react';
import {appendText} from 'core/editor3/helpers/draftInsertEntity';
import {SpacerBlock} from 'core/ui/components/Spacer';
import {canAddArticleEmbed} from 'core/editor3/components/article-embed/can-add-article-embed';
import {TextStatistics} from '../../../authoring/authoring/components/text-statistics';

interface IUserPreferences {
    characterLimitMode?: CharacterLimitUiBehavior;
}

type IProps = IEditorComponentProps<IEditor3ValueOperational, IEditor3Config, IUserPreferences>;

interface IState {
    /**
     * Wait until redux store is fully initialized before rendering the editor.
     * Initial spellchecking is done on `componentDidMount` and wouldn't work otherwise.
     */
    ready: boolean;

    autocompleteSuggestions: Array<string>;

    spellcheckerEnabled: boolean;
}

export class Editor extends React.PureComponent<IProps, IState> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            ready: false,
            autocompleteSuggestions: [],
            spellcheckerEnabled: false,
        };

        this.eventListenersToRemoveBeforeUnmounting = [];

        this.getCharacterLimitPreference = this.getCharacterLimitPreference.bind(this);
        this.syncPropsWithReduxStore = this.syncPropsWithReduxStore.bind(this);
        this.initializeEditor = this.initializeEditor.bind(this);
    }

    getCharacterLimitPreference(): EditorLimit | null {
        if (typeof this.props.config.maxLength !== 'number') {
            return null;
        }

        return {
            ui: this.props.editorPreferences.characterLimitMode ?? DEFAULT_UI_FOR_EDITOR_LIMIT,
            chars: this.props.config.maxLength,
        };
    }

    syncPropsWithReduxStore() {
        const store = this.props.value.store;
        const spellcheck = this.state.spellcheckerEnabled ? ng.get('spellcheck') : null;

        store.dispatch(setExternalOptions({
            editorFormat: this.props.config.editorFormat ?? [],
            singleLine: this.props.config.singleLine ?? false,
            readOnly: this.props.readOnly || this.props.config.readOnly,
            spellchecking: getInitialSpellcheckerData(spellcheck, this.props.language),
            limitConfig: this.getCharacterLimitPreference(),
            item: {
                language: this.props.language, // required for annotations to work
            },
        }));
    }

    /**
     * Can be called multiple times.
     */
    initializeEditor() {
        if (this.state.ready === true) {
            this.setState({ready: false});
        }

        const store = this.props.value.store;

        const spellcheck = ng.get('spellcheck');

        spellcheck.getDictionary(this.props.language).then((dict) => {
            spellcheck.isActiveDictionary = !!dict.length;
            spellcheck.setLanguage(this.props.language);
            spellcheck.setSpellcheckerStatus(true);

            this.syncPropsWithReduxStore();

            Promise.all([
                getAutocompleteSuggestions(this.props.editorId, this.props.language),
                initializeSpellchecker(store, spellcheck),
            ]).then((res) => {
                const [autocompleteSuggestions] = res;

                this.setState({ready: true, autocompleteSuggestions});

                /**
                 * If `spellchecker__set_status` is dispatched on `componentDidMount` in AuthoringReact,
                 * the event is fired before this component mounts and starts listening to the event.
                 * Because of this, requesting status explicitly is needed.
                 */
                dispatchEditorEvent('spellchecker__request_status', null);

                /**
                 * Avoid triggering `onChange` when nothing has actually changed.
                 * Spellchecker modifies inline styles (instead of being implemented as a decorator)
                 * and thus makes it impossible to check in a performant manner whether there
                 * were any actual changes when comparing 2 content states.
                 */
                setTimeout(() => {
                    store.subscribe(() => {
                        const contentState = store.getState().editorState.getCurrentContent();

                        if (this.props.value.contentState !== contentState) {
                            this.props.onChange({store, contentState});
                        }
                    });
                }, 1000);
            });
        });
    }

    componentDidMount() {
        this.initializeEditor();

        /**
         *
         * FIND AND REPLACE
         *
         */

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('find_and_replace__find', (event) => {
                const {editorId, text, caseSensitive} = event.detail;

                if (editorId !== this.props.editorId) {
                    return;
                }

                this.props.value.store.dispatch(
                    setHighlightCriteria({diff: {[text]: null}, caseSensitive}),
                );
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('find_and_replace__find_distinct', (event) => {
                const {editorId, matches, caseSensitive} = event.detail;

                if (editorId !== this.props.editorId) {
                    return;
                }

                const diff = matches.reduce((acc, key) => {
                    acc[key] = '';

                    return acc;
                }, {});

                this.props.value.store.dispatch(
                    setHighlightCriteria({diff, caseSensitive}),
                );
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('find_and_replace__request_for_current_selection_index', (event) => {
                dispatchEditorEvent(
                    'find_and_replace__receive_current_selection_index',
                    {editorId: this.props.editorId, selectionIndex: this.props.value.store.getState().searchTerm.index},
                );
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('find_and_replace__find_prev', (event) => {
                const {editorId} = event.detail;

                if (editorId !== this.props.editorId) {
                    return;
                }

                this.props.value.store.dispatch(findPrev());
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('find_and_replace__find_next', (event) => {
                const {editorId} = event.detail;

                if (editorId !== this.props.editorId) {
                    return;
                }

                this.props.value.store.dispatch(findNext());
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('find_and_replace__replace', (event) => {
                const {editorId, replaceWith, replaceAllMatches} = event.detail;

                if (editorId !== this.props.editorId) {
                    return;
                }

                if (replaceAllMatches) {
                    this.props.value.store.dispatch(replaceAll(replaceWith));
                } else {
                    this.props.value.store.dispatch(replace(replaceWith));
                }
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('find_and_replace__multi_replace', (event) => {
                const {editorId, replaceWith} = event.detail;

                if (editorId !== this.props.editorId) {
                    return;
                }

                this.props.value.store.dispatch(multiReplace(replaceWith));
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('authoring__patch_html', (event) => {
                const {editorId, editorState, html} = event.detail;

                if (editorId !== this.props.editorId) {
                    return;
                }

                this.props.value.store.dispatch(patchHTMLonEditorState({editorState, html, simpleReplace: false}));
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('authoring__update_editor_state', (event) => {
                const {editorId, article} = event.detail;

                if (editorId !== this.props.editorId) {
                    return;
                }

                this.props.value.store.dispatch(setEditorStateFromItem(article, editorId));
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addEditorEventListener('spellchecker__set_status', (event) => {
                this.props.value.store.dispatch(setSpellcheckerStatus(event.detail));
            }),
        );
    }

    componentWillUnmount() {
        for (const fn of this.eventListenersToRemoveBeforeUnmounting) {
            fn();
        }
    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.value.store !== prevProps.value.store) {
            this.initializeEditor();
        } else if (
            this.props.config !== prevProps.config
            || this.props.readOnly !== prevProps.readOnly
            || this.props.config.readOnly !== prevProps.config.readOnly
            || this.props.editorPreferences !== prevProps.editorPreferences
            || this.props.language !== prevProps.language
        ) {
            this.syncPropsWithReduxStore();
        }
    }

    render() {
        if (this.state.ready !== true) {
            return null;
        }

        const Container = this.props.container;

        const store = this.props.value.store;
        const {config} = this.props;
        const characterLimitConfig = this.getCharacterLimitPreference();
        const plainText = this.props.value.contentState.getPlainText();
        const invalidCharsDetected = (config.disallowedCharacters ?? []).filter((char) => plainText.includes(char));
        const showStatistics = config.showStatistics ?? true;

        const miniToolbar = (
            <div>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    {
                        showStatistics && (
                            <TextStatistics
                                text={this.props.value.contentState.getPlainText()}
                                language={this.props.language}
                                limit={this.props.config.maxLength}
                            />
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
                                                    const nextValue: EditorLimit = {
                                                        ...characterLimitConfig,
                                                        ui: ui,
                                                    };

                                                    this.props.onEditorPreferencesChange({
                                                        characterLimitMode: ui,
                                                    });

                                                    this.props.value.store.dispatch(
                                                        changeLimitConfig(nextValue),
                                                    );
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

                {
                    invalidCharsDetected.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'center',
                                justifyContent: 'end',
                            }}
                        >
                            <div className="editor3-invalid-chars-error">
                                {gettextPlural(
                                    invalidCharsDetected.length,
                                    'Character {{chars}} is not allowed',
                                    'The following characters are not allowed {{chars}}',
                                    {chars: invalidCharsDetected.join(' ')},
                                )}
                            </div>
                        </div>
                    )
                }
            </div>
        );

        const options = this.props.config.vocabularyId != null
            ? this.props.getVocabularyItems(this.props.config.vocabularyId)
            : null;

        const HelperComponent = this.props.config.helperComponent;

        return (
            <Container miniToolbar={miniToolbar}>
                {
                    HelperComponent != null && (
                        <HelperComponent
                            language={this.props.language}
                            readOnly={this.props.readOnly}
                            onChange={(value) => {
                                this.props.onChange(value);
                            }}
                        />
                    )
                }
                <Provider store={store}>
                    <ReactContextForEditor3.Provider value={store}>
                        {
                            options != null && (
                                <>
                                    <Select
                                        value=""
                                        onChange={(value) => {
                                            const editorState: EditorState = this.props.value.store
                                                .getState().editorState;

                                            this.props.value.store.dispatch(
                                                changeEditorState(appendText(value as string, editorState)),
                                            );
                                        }}
                                        label=""
                                        labelHidden
                                    >
                                        <Option value="" />
                                        {
                                            options.map((vocabularyItem, i) => (
                                                <Option key={i} value={vocabularyItem.value}>
                                                    {vocabularyItem.value}
                                                </Option>
                                            ))
                                        }
                                    </Select>
                                    <SpacerBlock v gap="16" />
                                </>
                            )
                        }
                        <Editor3
                            uiTheme={this.props.uiTheme}
                            scrollContainer=".sd-editor-content__main-container"
                            singleLine={config.singleLine ?? false}
                            cleanPastedHtml={config.cleanPastedHtml ?? false}
                            autocompleteSuggestions={this.state.autocompleteSuggestions}
                            canAddArticleEmbed={(srcId: string) => canAddArticleEmbed(srcId, this.props.item._id)}
                        />
                    </ReactContextForEditor3.Provider>
                </Provider>
            </Container>
        );
    }
}
