import React from 'react';
import {
    IArticle,
    IAuthoringFieldV2,
    IContentProfileV2,
    IAuthoringAction,
    IVocabularyItem,
    IAuthoringStorage,
    IFieldsAdapter,
    IBaseRestApiResponse,
    IStorageAdapter,
    IPropsAuthoring,
    ITopBarWidget,
    IExposedFromAuthoring,
    IKeyBindings,
    IAuthoringOptions,
    IStoreValueIncomplete,
    IAuthoringSectionTheme,
} from 'superdesk-api';
import {
    ButtonGroup,
    Loader,
    SubNav,
    IconButton,
} from 'superdesk-ui-framework/react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {gettext} from 'core/utils';
import {AuthoringSection} from './authoring-section/authoring-section';
import {EditorTest} from './ui-framework-authoring-test';
import {uiFrameworkAuthoringPanelTest, appConfig} from 'appConfig';
import {
    PINNED_WIDGET_USER_PREFERENCE_SETTINGS,
    closedIntentionally,
    widgetReactIntegration,
} from 'apps/authoring/widgets/widgets';
import {AuthoringWidgetLayoutComponent} from './widget-layout-component';
import {WidgetHeaderComponent} from './widget-header-component';
import {registerToReceivePatches, unregisterFromReceivingPatches} from 'apps/authoring-bridge/receive-patches';
import {addInternalEventListener} from 'core/internal-events';
import {
    showUnsavedChangesPrompt,
    IUnsavedChangesActionWithSaving,
} from 'core/ui/components/prompt-for-unsaved-changes';
import {assertNever} from 'core/helpers/typescript-helpers';
import {WithInteractiveArticleActionsPanel} from 'core/interactive-article-actions-panel/index-hoc';
import {sdApi} from 'api';
import {AuthoringToolbar} from './subcomponents/authoring-toolbar';
import {addInternalWebsocketEventListener, addWebsocketEventListener} from 'core/notification/notification';
import {AUTHORING_FIELD_PREFERENCES} from 'core/constants';
import {AuthoringActionsMenu} from './subcomponents/authoring-actions-menu';
import {Map} from 'immutable';
import {getField} from 'apps/fields';
import {preferences} from 'api/preferences';
import {dispatchEditorEvent, addEditorEventListener} from './authoring-react-editor-events';
import {previewAuthoringEntity} from './preview-article-modal';
import {WithKeyBindings} from './with-keybindings';
import {IFontSizeOption, ITheme, ProofreadingThemeModal} from './toolbar/proofreading-theme-modal';
import {showModal} from '@superdesk/common';
import ng from 'core/services/ng';
import {focusFirstChildInput} from 'utils/focus-first-child-input';

export function getFieldsData<T>(
    item: T,
    fields: Map<string, IAuthoringFieldV2>,
    fieldsAdapter: IFieldsAdapter<T>,
    authoringStorage: IAuthoringStorage<T>,
    storageAdapter: IStorageAdapter<T>,
    language: string,
) {
    return fields.map((field) => {
        const fieldEditor = getField(field.fieldType);

        const storageValue = (() => {
            if (fieldsAdapter[field.id]?.retrieveStoredValue != null) {
                return fieldsAdapter[field.id].retrieveStoredValue(item, authoringStorage);
            } else {
                return storageAdapter.retrieveStoredValue(item, field.id, field.fieldType);
            }
        })();

        const operationalValue = (() => {
            if (fieldEditor.toOperationalFormat != null) {
                return fieldEditor.toOperationalFormat(
                    storageValue,
                    field.fieldConfig,
                    language,
                );
            } else {
                return storageValue;
            }
        })();

        return operationalValue;
    }).toMap();
}

function serializeFieldsDataAndApplyOnEntity<T extends IBaseRestApiResponse>(
    item: T,
    fieldsProfile: Map<string, IAuthoringFieldV2>,
    fieldsData: Map<string, unknown>,
    userPreferencesForFields: {[key: string]: unknown},
    fieldsAdapter: IFieldsAdapter<T>,
    storageAdapter: IStorageAdapter<T>,
    preferIncomplete: IStoreValueIncomplete,
): T {
    let result: T = item;

    fieldsProfile.forEach((field) => {
        const fieldEditor = getField(field.fieldType);
        const valueOperational = fieldsData.get(field.id);

        const storageValue = (() => {
            if (fieldEditor.toStorageFormat != null) {
                return fieldEditor.toStorageFormat(
                    valueOperational,
                    field.fieldConfig,
                );
            } else {
                return valueOperational;
            }
        })();

        if (fieldsAdapter[field.id]?.storeValue != null) {
            result = fieldsAdapter[field.id].storeValue(storageValue, result, field.fieldConfig, preferIncomplete);
        } else {
            result = storageAdapter.storeValue(storageValue, field.id, result, field.fieldConfig, field.fieldType);
        }
    });

    return result;
}

const SPELLCHECKER_PREFERENCE = 'spellchecker:status';

const ANPA_CATEGORY = {
    vocabularyId: 'categories',
    fieldId: 'anpa_category',
};

function getInitialState<T extends IBaseRestApiResponse>(
    item: {saved: T; autosaved: T},
    profile: IContentProfileV2,
    userPreferencesForFields: IStateLoaded<T>['userPreferencesForFields'],
    spellcheckerEnabled: boolean,
    fieldsAdapter: IFieldsAdapter<T>,
    authoringStorage: IAuthoringStorage<T>,
    storageAdapter: IStorageAdapter<T>,
    language: string,
    validationErrors: IAuthoringValidationErrors,
    defaultTheme: ITheme,
    proofReadingTheme: ITheme,
): IStateLoaded<T> {
    const allFields = profile.header.merge(profile.content);

    const itemOriginal = item.saved;
    const itemWithChanges = item.autosaved ?? itemOriginal;

    const fieldsOriginal = getFieldsData(
        itemOriginal,
        allFields,
        fieldsAdapter,
        authoringStorage,
        storageAdapter,
        language,
    );

    const fieldsDataWithChanges: Map<string, unknown> = itemOriginal === itemWithChanges
        ? fieldsOriginal
        : getFieldsData(
            itemWithChanges,
            allFields,
            fieldsAdapter,
            authoringStorage,
            storageAdapter,
            language,
        );

    const toggledFields = {};

    allFields
        .filter((field) => field.fieldConfig.allow_toggling === true)
        .forEach((field) => {
            const val = fieldsDataWithChanges.get(field.id);

            const FieldEditorConfig = getField(field.fieldType);

            toggledFields[field.id] = FieldEditorConfig.hasValue(val);
        });

    const initialState: IStateLoaded<T> = {
        initialized: true,
        loading: false,
        itemOriginal: itemOriginal,
        itemWithChanges: itemWithChanges,
        autosaveEtag: item.autosaved?._etag ?? null,
        fieldsDataOriginal: fieldsOriginal,
        fieldsDataWithChanges: fieldsDataWithChanges,
        profile: profile,
        toggledFields: toggledFields,
        userPreferencesForFields,
        spellcheckerEnabled,
        validationErrors: validationErrors,
        allThemes: {
            default: defaultTheme,
            proofreading: proofReadingTheme,
        },
        proofreadingEnabled: false,
    };

    return initialState;
}

function getKeyBindingsFromActions<T>(actions: Array<ITopBarWidget<T>>): IKeyBindings {
    return actions
        .filter((action) => action.keyBindings != null)
        .reduce((acc, action) => {
            return {
                ...acc,
                ...action.keyBindings,
            };
        }, {});
}

export const getUiThemeFontSize = (value: IFontSizeOption) => {
    if (value === 'small') {
        return '1.4rem';
    } else if (value === 'medium') {
        return '1.6rem';
    } else if (value === 'large') {
        return '1.8rem';
    } else {
        assertNever(value);
    }
};

export const getUiThemeFontSizeHeading = (value: IFontSizeOption) => {
    if (value === 'small') {
        return '2.3rem';
    } else if (value === 'medium') {
        return '2.8rem';
    } else if (value === 'large') {
        return '3.2rem';
    } else {
        assertNever(value);
    }
};

/**
 * Toggling a field "off" hides it and removes its values.
 * Toggling to "on", displays field's input and allows setting a value.
 *
 * Only fields that have toggling enabled in content profile will be present in this object.
 * `true` means field is available - `false` - hidden.
 */
export type IToggledFields = {[fieldId: string]: boolean};
export type IAuthoringValidationErrors = {[fieldId: string]: string};

interface IStateLoaded<T> {
    initialized: true;
    itemOriginal: T;
    itemWithChanges: T;
    autosaveEtag: string | null;
    fieldsDataOriginal: Map<string, unknown>;
    fieldsDataWithChanges: Map<string, unknown>;
    profile: IContentProfileV2;
    userPreferencesForFields: {[key: string]: unknown};
    toggledFields: IToggledFields;
    spellcheckerEnabled: boolean;
    validationErrors: IAuthoringValidationErrors;

    /**
     * Prevents changes to state while async operation is in progress(e.g. saving).
     */
    loading: boolean;
    allThemes: {default: ITheme, proofreading: ITheme};
    proofreadingEnabled: boolean;
}

type IState<T> = {initialized: false} | IStateLoaded<T>;

export class AuthoringReact<T extends IBaseRestApiResponse> extends React.PureComponent<IPropsAuthoring<T>, IState<T>> {
    private cleanupFunctionsToRunBeforeUnmounting: Array<() => void>;
    private _mounted: boolean;
    private componentRef: HTMLElement | null;

    constructor(props: IPropsAuthoring<T>) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.save = this.save.bind(this);
        this.forceLock = this.forceLock.bind(this);
        this.discardUnsavedChanges = this.discardUnsavedChanges.bind(this);
        this.initiateClosing = this.initiateClosing.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.handleFieldsDataChange = this.handleFieldsDataChange.bind(this);
        this.handleUnsavedChanges = this.handleUnsavedChanges.bind(this);
        this.computeLatestEntity = this.computeLatestEntity.bind(this);
        this.setUserPreferences = this.setUserPreferences.bind(this);
        this.cancelAutosave = this.cancelAutosave.bind(this);
        this.getVocabularyItems = this.getVocabularyItems.bind(this);
        this.toggleField = this.toggleField.bind(this);
        this.updateItemWithChanges = this.updateItemWithChanges.bind(this);
        this.showThemeConfigModal = this.showThemeConfigModal.bind(this);
        this.onItemChange = this.onItemChange.bind(this);
        this.setLoadingState = this.setLoadingState.bind(this);
        this.reinitialize = this.reinitialize.bind(this);
        this.setRef = this.setRef.bind(this);

        const setStateOriginal = this.setState.bind(this);

        this.setState = (...args) => {
            const {state} = this;

            // disallow changing state while loading (for example when saving is in progress)
            const allow: boolean = (() => {
                if (state.initialized !== true) {
                    return true;
                } else if (args[0]['loading'] === false) {
                    // it is allowed to change state while loading
                    // only if it sets loading to false
                    return true;
                } else {
                    return state.loading === false;
                }
            })();

            if (allow) {
                setStateOriginal(...args);
            }
        };

        widgetReactIntegration.pinWidget = () => {
            const widgetPinned = !(this.props.sideWidget?.pinned ?? false);
            const update = {
                type: 'string',
                _id: widgetPinned ? this.props.sideWidget.id : null,
            };

            closedIntentionally.value = true;
            sdApi.preferences.update(PINNED_WIDGET_USER_PREFERENCE_SETTINGS, update);
            this.props.onSideWidgetChange({
                ...this.props.sideWidget,
                pinned: widgetPinned,
            });
        };

        widgetReactIntegration.getActiveWidget = () => {
            return this.props.sideWidget?.id ?? null;
        };

        widgetReactIntegration.getPinnedWidget = () => {
            const pinned = this.props.sideWidget?.pinned === true;

            if (pinned) {
                return this.props.sideWidget.id;
            }

            return null;
        };

        widgetReactIntegration.closeActiveWidget = () => {
            closedIntentionally.value = false;
            this.props.onSideWidgetChange(null);
        };

        widgetReactIntegration.WidgetHeaderComponent = WidgetHeaderComponent;
        widgetReactIntegration.WidgetLayoutComponent = AuthoringWidgetLayoutComponent;

        widgetReactIntegration.disableWidgetPinning = props.disableWidgetPinning ?? false;

        this.cleanupFunctionsToRunBeforeUnmounting = [];

        this.componentRef = null;
    }

    setRef(ref: HTMLElement) {
        this.componentRef = ref;
    }

    setLoadingState(state: IStateLoaded<T>, loading: boolean): Promise<void> {
        return new Promise<void>((resolve) => {
            this.setState({
                ...state,
                loading,
            }, () => {
                setTimeout(() => {
                    /**
                     * Timeout is used to wait until the view re-renders with a loading indicator.
                     * This is a workaround for rare scenarios where a field has a lot of data
                     * and takes a long time to synchronously serialize to storage format causing
                     * the browser to lock up for some time.
                     *
                     * Without the timeout, loading indicator would only get shown AFTER the long task had finished.
                     */
                    resolve();
                });
            });
        });
    }

    initiateUnmounting(): Promise<void> {
        if (!this.state.initialized) {
            return Promise.resolve();
        } else {
            return this.props.authoringStorage.autosave.flush();
        }
    }

    cancelAutosave(): Promise<void> {
        const {authoringStorage} = this.props;

        authoringStorage.autosave.cancel();

        if (this.state.initialized && this.state.autosaveEtag != null) {
            return authoringStorage.autosave.delete(this.state.itemOriginal['_id'], this.state.autosaveEtag);
        } else {
            return Promise.resolve();
        }
    }

    private showThemeConfigModal(state: IStateLoaded<T>) {
        showModal(({closeModal}) => {
            return (
                <ProofreadingThemeModal
                    onHide={closeModal}
                    onThemeChange={(res) => {
                        this.setState({
                            ...state,
                            allThemes: {
                                default: res.default,
                                proofreading: res.proofreading,
                            },
                        });
                    }}
                />
            );
        });
    }

    /**
     * This is a relatively computationally expensive operation that serializes all fields.
     * It is meant to be called when an article is to be saved/autosaved.
     */
    computeLatestEntity(options?: {preferIncomplete?: IStoreValueIncomplete}): T {
        const state = this.state;

        if (state.initialized !== true) {
            throw new Error('Authoring not initialized');
        }

        const allFields = state.profile.header.merge(state.profile.content);

        const itemWithFieldsApplied = serializeFieldsDataAndApplyOnEntity(
            state.itemWithChanges,
            allFields,
            state.fieldsDataWithChanges,
            state.userPreferencesForFields,
            this.props.fieldsAdapter,
            this.props.storageAdapter,
            options?.preferIncomplete ?? false,
        );

        return itemWithFieldsApplied;
    }

    handleFieldChange(fieldId: string, data: unknown) {
        const {state} = this;

        if (state.initialized !== true) {
            throw new Error('can not change field value when authoring is not initialized');
        }

        const {onFieldChange} = this.props;
        const fieldsDataUpdated = state.fieldsDataWithChanges.set(fieldId, data);

        this.setState({
            ...state,
            fieldsDataWithChanges: onFieldChange == null
                ? fieldsDataUpdated
                : onFieldChange(fieldId, fieldsDataUpdated, this.computeLatestEntity),
        });
    }

    handleFieldsDataChange(fieldsData: Map<string, unknown>): void {
        const {state} = this;

        if (state.initialized) {
            this.setState({
                ...state,
                fieldsDataWithChanges: fieldsData,
            });
        }
    }

    hasUnsavedChanges() {
        if (this.state.initialized) {
            return (this.state.itemOriginal !== this.state.itemWithChanges)
                || (this.state.fieldsDataOriginal !== this.state.fieldsDataWithChanges);
        } else {
            return false;
        }
    }

    getVocabularyItems(vocabularyId): Array<IVocabularyItem> {
        const vocabulary = sdApi.vocabularies.getAll().get(vocabularyId);

        if (vocabularyId === ANPA_CATEGORY.vocabularyId) {
            return vocabulary.items;
        }

        const anpaCategoryQcodes: Array<string> = this.state.initialized ?
            (this.state.fieldsDataWithChanges.get(ANPA_CATEGORY.fieldId) as Array<any> ?? [])
            : [];

        if (vocabulary.service == null || vocabulary.service?.all != null) {
            return vocabulary.items.filter(
                (vocabularyItem) => {
                    if (vocabularyItem.service == null) {
                        return true;
                    } else {
                        return anpaCategoryQcodes.some((qcode) => vocabularyItem.service[qcode] != null);
                    }
                },
            );
        } else if (anpaCategoryQcodes.some((qcode) => vocabulary.service?.[qcode] != null)) {
            return vocabulary.items;
        } else {
            return [];
        }
    }

    componentDidMount() {
        const authThemes = ng.get('authThemes');

        this._mounted = true;

        const {authoringStorage} = this.props;

        Promise.all(
            [
                authoringStorage.getEntity(this.props.itemId).then((item) => {
                    const itemCurrent = item.autosaved ?? item.saved;

                    return authoringStorage.getContentProfile(itemCurrent, this.props.fieldsAdapter).then((profile) => {
                        return {item, profile};
                    });
                }),
                authoringStorage.getUserPreferences(),
                authThemes.get('theme'),
                authThemes.get('proofreadTheme'),
            ],
        ).then((res) => {
            const [{item, profile}, userPreferences, defaultTheme, proofReadingTheme] = res;

            const spellcheckerEnabled =
                userPreferences[SPELLCHECKER_PREFERENCE].enabled
                ?? userPreferences[SPELLCHECKER_PREFERENCE].default
                ?? true;

            const initialState = getInitialState(
                item,
                profile,
                userPreferences[AUTHORING_FIELD_PREFERENCES] ?? {},
                spellcheckerEnabled,
                this.props.fieldsAdapter,
                this.props.authoringStorage,
                this.props.storageAdapter,
                this.props.getLanguage(item.autosaved ?? item.saved),
                {},
                defaultTheme,
                proofReadingTheme,
            );

            this.props.onEditingStart?.(initialState.itemWithChanges);

            this.setState(initialState);

            if (this.componentRef != null && this.props.autoFocus !== false) {
                this.cleanupFunctionsToRunBeforeUnmounting.push(focusFirstChildInput(this.componentRef).cancel);
            }
        });

        registerToReceivePatches(this.props.itemId, (patch) => {
            const {state} = this;

            if (state.initialized) {
                this.setState({
                    ...state,
                    itemWithChanges: {
                        ...state.itemWithChanges,
                        ...patch,
                    },
                });
            }
        });

        this.cleanupFunctionsToRunBeforeUnmounting.push(
            addEditorEventListener('spellchecker__request_status', (event) => {
                if (this.state.initialized) {
                    event.detail(this.state.spellcheckerEnabled);
                }
            }),
        );

        this.cleanupFunctionsToRunBeforeUnmounting.push(
            addInternalEventListener(
                'replaceAuthoringDataWithChanges',
                (event) => {
                    const {state} = this;
                    const article = event.detail;

                    if (state.initialized) {
                        this.setState(this.updateItemWithChanges(state, article));
                    }
                },
            ),
        );

        this.cleanupFunctionsToRunBeforeUnmounting.push(
            addInternalEventListener(
                'dangerouslyOverwriteAuthoringData',
                (event) => {
                    if (event.detail.item._id === this.props.itemId) {
                        const patch = event.detail.item;

                        const {state} = this;

                        if (state.initialized) {
                            if (state.itemOriginal === state.itemWithChanges) {
                                /**
                                 * if object references are the same before patching
                                 * they should be the same after patching too
                                 * in order for checking for changes to work correctly
                                 * (reference equality is used for change detection)
                                 */

                                const patched = {
                                    ...state.itemOriginal,
                                    ...patch,
                                };

                                this.setState({
                                    ...state,
                                    itemOriginal: patched,
                                    itemWithChanges: patched,
                                });
                            } else {
                                this.setState({
                                    ...state,
                                    itemWithChanges: {
                                        ...state.itemWithChanges,
                                        ...patch,
                                    },
                                    itemOriginal: {
                                        ...state.itemOriginal,
                                        ...patch,
                                    },
                                });
                            }
                        }
                    }
                },
            ),
        );

        /**
         * Update UI when locked in another session,
         * regardless whether by same or different user.
         */
        this.cleanupFunctionsToRunBeforeUnmounting.push(
            addInternalWebsocketEventListener('item:lock', (data) => {
                const {user, lock_session, lock_time, _etag} = data.extra;

                const state = this.state;

                if (state.initialized && (state.itemOriginal._id === data.extra.item)) {
                    /**
                     * Only patch these fields to preserve
                     * unsaved changes.
                     * FINISH: remove IArticle usage
                     */
                    const patch: Partial<IArticle> = {
                        _etag,
                        lock_session,
                        lock_time,
                        lock_user: user,
                        lock_action: 'edit',
                    };

                    if (!this.hasUnsavedChanges()) {
                        /**
                         * if object references are the same before patching
                         * they should be the same after patching too
                         * in order for checking for changes to work correctly
                         * (reference equality is used for change detection)
                         */

                        const patched = {
                            ...state.itemOriginal,
                            ...patch,
                        };

                        this.setState({
                            ...state,
                            itemOriginal: patched,
                            itemWithChanges: patched,
                        });
                    } else {
                        this.setState({
                            ...state,
                            itemOriginal: {
                                ...state.itemOriginal,
                                ...patch,
                            },
                            itemWithChanges: {
                                ...state.itemWithChanges,
                                ...patch,
                            },
                        });
                    }
                }
            }),
        );

        this.cleanupFunctionsToRunBeforeUnmounting.push(
            addInternalEventListener(
                'dangerouslyOverwriteAuthoringField',
                (event) => {
                    if (event.detail.itemId === this.props.itemId) {
                        const patch = {[event.detail.field.key]: event.detail.field.value};

                        const {state} = this;

                        if (state.initialized) {
                            if (state.itemOriginal === state.itemWithChanges) {
                                /**
                                 * if object references are the same before patching
                                 * they should be the same after patching too
                                 * in order for checking for changes to work correctly
                                 * (reference equality is used for change detection)
                                 */

                                const patched = {
                                    ...state.itemOriginal,
                                    ...patch,
                                };

                                this.setState({
                                    ...state,
                                    itemOriginal: patched,
                                    itemWithChanges: patched,
                                });
                            } else {
                                this.setState({
                                    ...state,
                                    itemWithChanges: {
                                        ...state.itemWithChanges,
                                        ...patch,
                                    },
                                    itemOriginal: {
                                        ...state.itemOriginal,
                                        ...patch,
                                    },
                                });
                            }
                        }
                    }
                },
            ),
        );

        /**
         * Reload item if updated while locked in another session.
         * Unless there are unsaved changes.
         */
        this.cleanupFunctionsToRunBeforeUnmounting.push(
            addWebsocketEventListener('resource:updated', (event) => {
                const {_id, resource} = event.extra;
                const state = this.state;

                if (state.initialized !== true) {
                    return;
                }

                if (
                    this.props.resourceNames.includes(resource) !== true
                    || state.itemOriginal._id !== _id
                ) {
                    return;
                }

                if (authoringStorage.isLockedInCurrentSession(state.itemOriginal)) {
                    return;
                }

                if (this.hasUnsavedChanges()) {
                    return;
                }

                authoringStorage.getEntity(state.itemOriginal._id).then((item) => {
                    this.setState(getInitialState(
                        item,
                        state.profile,
                        state.userPreferencesForFields,
                        state.spellcheckerEnabled,
                        this.props.fieldsAdapter,
                        this.props.authoringStorage,
                        this.props.storageAdapter,
                        this.props.getLanguage(item.autosaved ?? item.saved),
                        state.validationErrors,
                        state.allThemes.default,
                        state.allThemes.proofreading,
                    ));
                });
            }),
        );

        this.cleanupFunctionsToRunBeforeUnmounting.push(
            addInternalEventListener('dangerouslyForceReloadAuthoring', () => {
                const state = this.state;

                if (state.initialized !== true) {
                    return;
                }

                authoringStorage.getEntity(state.itemOriginal._id).then((item) => {
                    this.setState(getInitialState(
                        item,
                        state.profile,
                        state.userPreferencesForFields,
                        state.spellcheckerEnabled,
                        this.props.fieldsAdapter,
                        this.props.authoringStorage,
                        this.props.storageAdapter,
                        this.props.getLanguage(item.autosaved ?? item.saved),
                        state.validationErrors,
                        state.allThemes.default,
                        state.allThemes.proofreading,
                    ));
                });
            }),
        );
    }

    componentWillUnmount() {
        this._mounted = false;

        const state = this.state;

        if (state.initialized) {
            this.props.onEditingEnd?.(state.itemWithChanges);
        }

        unregisterFromReceivingPatches();

        for (const fn of this.cleanupFunctionsToRunBeforeUnmounting) {
            fn();
        }
    }

    componentDidUpdate(_prevProps, prevState: IState<T>) {
        const {authoringStorage} = this.props;
        const state = this.state;

        if (
            state.initialized
            && prevState.initialized
            && authoringStorage.isLockedInCurrentSession(state.itemOriginal)
        ) {
            const articleChanged = (state.itemWithChanges !== prevState.itemWithChanges)
                || (state.fieldsDataWithChanges !== prevState.fieldsDataWithChanges);

            if (articleChanged) {
                if (this.hasUnsavedChanges()) {
                    authoringStorage.autosave.schedule(
                        () => {
                            return this.computeLatestEntity({preferIncomplete: true});
                        },
                        (autosaved) => {
                            this.setState({
                                ...state,
                                autosaveEtag: autosaved._etag,
                            });
                        },
                    );
                }
            }
        }
    }

    handleUnsavedChanges(state: IStateLoaded<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.hasUnsavedChanges()) {
                resolve(state.itemOriginal);
                return;
            }

            return showUnsavedChangesPrompt(true).then(({action, closePromptFn}) => {
                if (action === IUnsavedChangesActionWithSaving.cancelAction) {
                    closePromptFn();
                    reject();
                } else if (action === IUnsavedChangesActionWithSaving.discardChanges) {
                    this.discardUnsavedChanges(state).then(() => {
                        closePromptFn();

                        if (this.state.initialized) {
                            resolve(this.state.itemOriginal);
                        }
                    });
                } else if (action === IUnsavedChangesActionWithSaving.save) {
                    this.save(state).then(() => {
                        closePromptFn();

                        if (this.state.initialized) {
                            resolve(this.state.itemOriginal);
                        }
                    });
                } else {
                    assertNever(action);
                }
            });
        });
    }

    save(state: IStateLoaded<T>): Promise<T> {
        const {authoringStorage} = this.props;

        if ((this.props.validateBeforeSaving ?? true) === true) {
            const {profile} = state;
            const allFields = profile.header.merge(profile.content);

            const validationErrors: IAuthoringValidationErrors = allFields.toArray()
                .filter((field) => {
                    if (field.fieldConfig.required === true) {
                        const FieldEditorConfig = getField(field.fieldType);

                        return !FieldEditorConfig.hasValue(state.fieldsDataWithChanges.get(field.id));
                    } else {
                        return false;
                    }
                }).reduce<IAuthoringValidationErrors>((acc, field) => {
                    acc[field.id] = gettext('Field is required');

                    return acc;
                }, {});

            if (Object.keys(validationErrors).length > 0) {
                this.setState({
                    ...state,
                    validationErrors,
                });

                return Promise.reject('validation errors were found');
            }
        }

        return this.setLoadingState(state, true)
            .then(() => this.cancelAutosave())
            .then(() => {
                return authoringStorage.saveEntity(
                    this.computeLatestEntity(),
                    state.itemOriginal,
                ).then((item: T) => {
                    const nextState = getInitialState(
                        {saved: item, autosaved: item},
                        state.profile,
                        state.userPreferencesForFields,
                        state.spellcheckerEnabled,
                        this.props.fieldsAdapter,
                        this.props.authoringStorage,
                        this.props.storageAdapter,
                        this.props.getLanguage(item),
                        {}, // clear validation errors
                        state.allThemes.default,
                        state.allThemes.proofreading,
                    );

                    if (this._mounted) {
                        this.setState(nextState);
                    }

                    return item;
                });
            });
    }

    /**
     * Unlocks article from other user that holds the lock
     * and locks for current user.
     */
    forceLock(state: IStateLoaded<T>): void {
        const {authoringStorage} = this.props;

        authoringStorage.forceLock(state.itemOriginal);
    }

    discardUnsavedChanges(state: IStateLoaded<T>): Promise<void> {
        return this.cancelAutosave().then(() => {
            return new Promise((resolve) => {
                const stateNext: IStateLoaded<T> = {
                    ...state,
                    itemWithChanges: state.itemOriginal,
                    fieldsDataWithChanges: state.fieldsDataOriginal,
                };

                this.setState(stateNext, () => {
                    resolve();
                });
            });
        });
    }

    /**
     * Closing is initiated, the logic to handle unsaved changes runs
     * and unless closing is cancelled by user action in the UI this.props.onClose is called.
     */
    initiateClosing(state: IStateLoaded<T>): void {
        const {authoringStorage} = this.props;

        this.setLoadingState(state, true).then(() => {
            authoringStorage.closeAuthoring(
                this.computeLatestEntity(),
                state.itemOriginal,
                this.hasUnsavedChanges(),
                () => {
                    authoringStorage.autosave.cancel();

                    return authoringStorage.autosave.delete(state.itemOriginal._id, state.autosaveEtag);
                },
                () => this.props.onClose(),
            ).then(() => {
                /**
                 * The promise will also resolve
                 * if user decides to cancel closing.
                 */
                if (this._mounted) {
                    this.setLoadingState(state, false);
                }
            });
        });
    }

    setUserPreferences(val: IStateLoaded<T>['userPreferencesForFields']) {
        const state = this.state;

        if (state.initialized !== true) {
            return;
        }

        preferences.update(AUTHORING_FIELD_PREFERENCES, val);

        this.setState({
            ...state,
            userPreferencesForFields: val,
        });
    }

    toggleField(fieldId: string) {
        if (!this.state.initialized) {
            return;
        }

        const {profile, itemWithChanges, toggledFields, fieldsDataWithChanges} = this.state;
        const allFields = profile.header.merge(profile.content);
        const field = allFields.get(fieldId);
        const FieldEditorConfig = getField(field.fieldType);
        const {fieldsAdapter, getLanguage} = this.props;

        const toggledValueNext: boolean = !toggledFields[fieldId];

        const onToggledOn = fieldsAdapter[fieldId]?.onToggledOn ?? FieldEditorConfig.onToggledOn;

        /**
         * When toggled to "off", clear current value by setting an empty one.
         * Removing a value entirely wouldn't work, because our REST API
         * doesn't support patches that can remove keys.
         *
         * When toggled to "on", set value returned from `onToggledOn` if it is defined.
         */
        const fieldValuesNext = toggledValueNext === true
            ? onToggledOn == null ?
                fieldsDataWithChanges
                : fieldsDataWithChanges.set(
                    fieldId,
                    onToggledOn({
                        language: getLanguage(this.state.itemWithChanges),
                        config: field.fieldConfig,
                        editorPreferences: this.state.userPreferencesForFields[field.id],
                        fieldsData: this.state.fieldsDataWithChanges,
                    }),
                )
            : fieldsDataWithChanges.set(
                fieldId,
                FieldEditorConfig.getEmptyValue(field.fieldConfig, getLanguage(itemWithChanges)),
            );

        this.setState({
            ...this.state,
            toggledFields: {
                ...toggledFields,
                [fieldId]: toggledValueNext,
            },
            fieldsDataWithChanges: fieldValuesNext,
        });
    }

    updateItemWithChanges(state: IStateLoaded<T>, itemPartial: Partial<T>): IStateLoaded<T> {
        const {profile} = state;
        const fields = profile.header.merge(profile.content);

        const itemPatched = {
            ...state.itemWithChanges,
            ...itemPartial,
        };

        const fieldsDataNext = getFieldsData(
            itemPatched,
            fields,
            this.props.fieldsAdapter,
            this.props.authoringStorage,
            this.props.storageAdapter,
            this.props.getLanguage(itemPatched),
        );

        return {
            ...state,
            itemWithChanges: itemPatched,
            fieldsDataWithChanges: fieldsDataNext,
        };
    }

    onItemChange(state: IStateLoaded<T>, itemWithChanges: T) {
        this.setState({
            ...state,
            itemWithChanges,
        });
    }

    /**
     * Use this method sparingly. It is performance intensive.
     * It was added to make it possible to update data from outside authoring-react component.
     * The reason it is needed, is that authoring-react treats `fieldsData` as a source of truth
     * and when outside code sends updated `{item:T }` there is not other way for authoring-react
     * to apply it to `fieldsData`, but to re-initialize.
     */
    reinitialize(
        state: IStateLoaded<T>,
        itemWithUpdates: T,
        newProfile?: IContentProfileV2,
    ) {
        const item: {
            saved: T;
            autosaved: T;
        } = {
            saved: state.itemOriginal,
            autosaved: itemWithUpdates,
        };

        this.setState(getInitialState(
            item,
            newProfile ?? state.profile,
            state.userPreferencesForFields,
            state.spellcheckerEnabled,
            this.props.fieldsAdapter,
            this.props.authoringStorage,
            this.props.storageAdapter,
            this.props.getLanguage(item.autosaved ?? item.saved),
            state.validationErrors,
            state.allThemes.default,
            state.allThemes.proofreading,
        ));
    }

    render() {
        const state = this.state;
        const {authoringStorage, fieldsAdapter, storageAdapter, getLanguage, getSidePanel} = this.props;

        if (state.initialized !== true) {
            return null;
        }

        // TODO: remove test code
        if (uiFrameworkAuthoringPanelTest) {
            return (
                <div>
                    <EditorTest />
                </div>
            );
        }

        const exposed: IExposedFromAuthoring<T> = {
            item: state.itemWithChanges,
            contentProfile: state.profile,
            getLatestItem: this.computeLatestEntity,
            fieldsData: state.fieldsDataWithChanges,
            handleFieldsDataChange: this.handleFieldsDataChange,
            hasUnsavedChanges: () => this.hasUnsavedChanges(),
            handleUnsavedChanges: () => this.handleUnsavedChanges(state),
            save: () => this.save(state),
            initiateClosing: () => this.initiateClosing(state),
            keepChangesAndClose: () => this.props.onClose(),
            onItemChange: (item: T) => this.onItemChange(state, item),
            stealLock: () => this.forceLock(state),
            authoringStorage: authoringStorage,
            storageAdapter: storageAdapter,
            fieldsAdapter: fieldsAdapter,
            sideWidget: this.props.sideWidget?.id ?? null,
            toggleSideWidget: (id) => {
                if (id == null || this.props.sideWidget?.id === id) {
                    this.props.onSideWidgetChange(null);
                } else {
                    this.props.onSideWidgetChange({
                        id: id,
                        pinned: false,
                    });
                }
            },
            addValidationErrors: (moreValidationErrors) => {
                this.setState({
                    ...state,
                    validationErrors: {
                        ...state.validationErrors,
                        ...moreValidationErrors,
                    },
                });
            },
        };

        const authoringOptions: IAuthoringOptions<T> | null =
            this.props.getInlineToolbarActions != null ? this.props.getInlineToolbarActions(exposed) : null;
        const readOnly = state.initialized ? authoringOptions?.readOnly : false;
        const OpenWidgetComponent = getSidePanel == null ? null : this.props.getSidePanel(exposed, readOnly);

        const authoringActions: Array<IAuthoringAction> = (() => {
            const actions = this.props.getActions?.(exposed) ?? [];
            const coreActions: Array<IAuthoringAction> = [];

            if (appConfig.features.useTansaProofing !== true) {
                if (state.spellcheckerEnabled) {
                    const nextValue = false;

                    coreActions.push({
                        label: gettext('Disable spellchecker'),
                        onTrigger: () => {
                            this.setState({
                                ...state,
                                spellcheckerEnabled: nextValue,
                            });

                            dispatchEditorEvent('spellchecker__set_status', nextValue);

                            preferences.update(SPELLCHECKER_PREFERENCE, {
                                type: 'bool',
                                enabled: nextValue,
                                default: true,
                            });
                        },
                        keyBindings: {
                            'ctrl+shift+y': () => {
                                this.setState({
                                    ...state,
                                    spellcheckerEnabled: nextValue,
                                });

                                dispatchEditorEvent('spellchecker__set_status', nextValue);

                                preferences.update(SPELLCHECKER_PREFERENCE, {
                                    type: 'bool',
                                    enabled: nextValue,
                                    default: true,
                                });
                            },
                        },
                    });
                } else {
                    coreActions.push({
                        label: gettext('Enable spellchecker'),
                        onTrigger: () => {
                            const nextValue = true;

                            this.setState({
                                ...state,
                                spellcheckerEnabled: true,
                            });

                            dispatchEditorEvent('spellchecker__set_status', nextValue);

                            preferences.update(SPELLCHECKER_PREFERENCE, {
                                type: 'bool',
                                enabled: nextValue,
                                default: true,
                            });
                        },
                        keyBindings: {
                            'ctrl+shift+y': () => {
                                const nextValue = true;

                                this.setState({
                                    ...state,
                                    spellcheckerEnabled: true,
                                });

                                dispatchEditorEvent('spellchecker__set_status', nextValue);

                                preferences.update(SPELLCHECKER_PREFERENCE, {
                                    type: 'bool',
                                    enabled: nextValue,
                                    default: true,
                                });
                            },
                        },
                    });
                }
            }

            return [...coreActions, ...actions];
        })();

        const keyBindingsFromAuthoringActions: IKeyBindings = authoringActions.reduce((acc, action) => {
            return {
                ...acc,
                ...(action.keyBindings ?? {}),
            };
        }, {});

        const widgetsCount = this.props.getSidebarWidgetsCount(exposed);

        const widgetKeybindings: IKeyBindings = {};

        for (let i = 0; i < widgetsCount; i++) {
            widgetKeybindings[`ctrl+alt+${i + 1}`] = () => {
                const nextWidgetName: string = this.props.getSideWidgetIdAtIndex(exposed.item, i);

                this.props.onSideWidgetChange({
                    id: nextWidgetName,
                    pinned: this.props.sideWidget?.pinned ?? false,
                });
            };
        }

        const primaryToolbarWidgets: Array<ITopBarWidget<T>> = authoringOptions?.actions != null ? [
            ...authoringOptions.actions,
            {
                group: 'end',
                priority: 0.4,
                component: () => {
                    return (
                        <AuthoringActionsMenu getActions={() => authoringActions} />
                    );
                },
                availableOffline: true,
            },
        ] : [];

        const pinned = this.props.sideWidget?.pinned === true;

        const printPreviewAction = (() => {
            const execute = () => {
                previewAuthoringEntity(
                    state.itemWithChanges,
                    state.profile,
                    state.fieldsDataWithChanges,
                );
            };

            const preview = {
                jsxButton: () => {
                    return (
                        <IconButton
                            icon="preview-mode"
                            ariaValue={gettext('Print preview')}
                            onClick={() => {
                                execute();
                            }}
                        />
                    );
                },
                keybindings: {
                    'ctrl+shift+i': () => {
                        execute();
                    },
                },
            };

            return preview;
        })();

        const allKeyBindings: IKeyBindings = {
            ...printPreviewAction.keybindings,
            ...getKeyBindingsFromActions(authoringOptions?.actions ?? []),
            ...keyBindingsFromAuthoringActions,
            ...widgetKeybindings,
        };

        const activeTheme = state.proofreadingEnabled ? state.allThemes.proofreading : state.allThemes.default;

        const uiTheme: IAuthoringSectionTheme = {
            backgroundColor: activeTheme.theme,
            backgroundColorSecondary: activeTheme.themeColorSecondary,
            textColor: activeTheme.textColor,
            fontFamily: activeTheme.fontFamily,
            fieldTheme: {
                headline: {
                    fontSize: getUiThemeFontSizeHeading(activeTheme.headline),
                },
                abstract: {
                    fontSize: getUiThemeFontSize(activeTheme.abstract),
                },
                body_html: {
                    fontSize: getUiThemeFontSize(activeTheme.body),
                },
            },
        };

        const onChangeSideWidget = (item: T) => {
            authoringStorage.getContentProfile(item, this.props.fieldsAdapter)
                .then((res) => {
                    this.reinitialize(state, item, res);
                });
        };

        return (
            <div style={{display: 'contents'}} ref={this.setRef}>
                {
                    state.loading && (
                        <Loader overlay />
                    )
                }

                <WithKeyBindings keyBindings={allKeyBindings}>
                    <WithInteractiveArticleActionsPanel location="authoring">
                        {(panelState, panelActions) => (
                            <Layout.AuthoringFrame
                                header={
                                    primaryToolbarWidgets.length < 1
                                        && this.props.getAuthoringPrimaryToolbarWidgets == null
                                        ? undefined
                                        : (
                                            <SubNav>
                                                <AuthoringToolbar
                                                    entity={state.itemWithChanges}
                                                    coreWidgets={primaryToolbarWidgets}
                                                    extraWidgets={
                                                        this.props.getAuthoringPrimaryToolbarWidgets(exposed)
                                                    }
                                                    backgroundColor={authoringOptions?.toolbarBgColor}
                                                />
                                            </SubNav>
                                        )
                                }
                                main={(
                                    <Layout.AuthoringMain
                                        noPaddingForContent
                                        headerCollapsed={this.props.headerCollapsed}
                                        toolBar={this.props.hideSecondaryToolbar ? undefined : (
                                            <React.Fragment>
                                                <div
                                                    style={{
                                                        paddingInlineEnd: 16,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    {this.props.secondaryToolbarWidgets.map((Component, i) => (
                                                        <Component
                                                            key={i}
                                                            onChange={(item) => {
                                                                onChangeSideWidget(item);
                                                            }}
                                                            item={state.itemWithChanges}
                                                        />
                                                    ))}
                                                </div>

                                                <ButtonGroup align="end">

                                                    {printPreviewAction.jsxButton()}

                                                    {this.props.themingEnabled === true && (
                                                        <>
                                                            <IconButton
                                                                icon="adjust"
                                                                ariaValue={gettext('Toggle theme')}
                                                                onClick={() => {
                                                                    this.setState({
                                                                        ...state,
                                                                        proofreadingEnabled:
                                                                            !state.proofreadingEnabled,
                                                                    });
                                                                }}
                                                            />
                                                            <IconButton
                                                                icon="switches"
                                                                ariaValue={gettext('Configure themes')}
                                                                onClick={() => {
                                                                    this.showThemeConfigModal(state);
                                                                }}
                                                            />
                                                        </>
                                                    )}

                                                </ButtonGroup>

                                            </React.Fragment>
                                        )}
                                        authoringHeader={(
                                            <AuthoringSection
                                                fields={state.profile.header}
                                                fieldsData={state.fieldsDataWithChanges}
                                                onChange={this.handleFieldChange}
                                                reinitialize={(item) => {
                                                    this.reinitialize(state, item);
                                                }}
                                                language={getLanguage(state.itemWithChanges)}
                                                userPreferencesForFields={state.userPreferencesForFields}
                                                useHeaderLayout
                                                setUserPreferencesForFields={this.setUserPreferences}
                                                getVocabularyItems={this.getVocabularyItems}
                                                toggledFields={state.toggledFields}
                                                toggleField={this.toggleField}
                                                readOnly={readOnly}
                                                validationErrors={state.validationErrors}
                                                item={state.itemWithChanges}
                                                computeLatestEntity={this.computeLatestEntity}
                                            />
                                        )}
                                    >
                                        <AuthoringSection
                                            uiTheme={uiTheme}
                                            padding="3.2rem 4rem 5.2rem 4rem"
                                            fields={state.profile.content}
                                            fieldsData={state.fieldsDataWithChanges}
                                            onChange={this.handleFieldChange}
                                            reinitialize={(item) => {
                                                this.reinitialize(state, item);
                                            }}
                                            language={getLanguage(state.itemWithChanges)}
                                            userPreferencesForFields={state.userPreferencesForFields}
                                            setUserPreferencesForFields={this.setUserPreferences}
                                            getVocabularyItems={this.getVocabularyItems}
                                            toggledFields={state.toggledFields}
                                            toggleField={this.toggleField}
                                            readOnly={readOnly}
                                            validationErrors={state.validationErrors}
                                            item={state.itemWithChanges}
                                            computeLatestEntity={this.computeLatestEntity}
                                        />
                                    </Layout.AuthoringMain>
                                )}
                                sideOverlay={!pinned && OpenWidgetComponent != null && OpenWidgetComponent}
                                sideOverlayOpen={!pinned && OpenWidgetComponent != null}
                                sidePanel={pinned && OpenWidgetComponent != null && OpenWidgetComponent}
                                sidePanelOpen={pinned && OpenWidgetComponent != null}
                                sideBar={this.props.getSidebar?.(exposed)}
                            />
                        )}
                    </WithInteractiveArticleActionsPanel>
                </WithKeyBindings>
            </div>
        );
    }
}
