/* eslint-disable react/no-multi-comp */
/* eslint-disable complexity */
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {convertToRaw, EditorState} from 'draft-js';
import {AnyAction, Store} from 'redux';

import {Editor3} from './components';
import createEditorStore, {
    generateAnnotations,
    IEditorStore,
    prepareEditor3StateForExport,
    syncAssociations,
} from './store';
import {getContentStateFromHtml} from './html/from-html';

import {changeEditorState, setReadOnly, changeLimitConfig, setExternalOptions} from './actions';

import ng from 'core/services/ng';
import {IArticle, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {addInternalEventListener} from 'core/internal-events';
import {
    CharacterCountConfigButton,
    CharacterLimitUiBehavior,
} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {fieldsMetaKeys, FIELD_KEY_SEPARATOR, setFieldMetadata} from './helpers/fieldsMeta';
import {AUTHORING_FIELD_PREFERENCES} from 'core/constants';
import {getAutocompleteSuggestions} from 'core/helpers/editor';
import {findParentScope, gettext} from '../utils';
import {editor3StateToHtml} from './html/to-html/editor3StateToHtml';
import {canAddArticleEmbed} from './components/article-embed/can-add-article-embed';
import {TextStatisticsConnected} from 'apps/authoring/authoring/components/text-statistics-connected';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {ValidateCharactersConnected} from 'apps/authoring/authoring/ValidateCharactersConnected';
import {Spacer} from 'core/ui/components/Spacer';
import {copyEmbeddedArticlesIntoAssociations} from 'apps/authoring-react/copy-embedded-articles-into-associations';

/**
 * @ngdoc directive
 * @module superdesk.core.editor3
 * @param {Array} editorFormat the formating settings available for editor
 * @param {String} value the model for editor value
 * @param {Boolean} readOnly true if the editor is read only
 * @param {Function} onChange the callback executed when the editor value is changed
 * @param {String} language the current language used for spellchecker
 * @description integrates react Editor3 component with superdesk app.
 */
export const sdEditor3 = () => new Editor3Directive();

// used in HighlightsPopup
export const ReactContextForEditor3 = React.createContext<Store>(null);

function generateHtml(
    store: Store<IEditorStore, AnyAction>,
    item: IArticle,
    pathToValue: string,
) {
    const state = store.getState();
    const {editorState} = state;
    const contentState = editorState.getCurrentContent();

    if (pathToValue == null || pathToValue.length < 1) {
        throw new Error('pathToValue is required');
    }

    const contentStatePreparedForExport = prepareEditor3StateForExport(contentState);
    const rawState = convertToRaw(contentStatePreparedForExport);

    setFieldMetadata(
        item,
        pathToValue,
        fieldsMetaKeys.draftjsState,
        rawState,
    );

    if (pathToValue === 'body_html') {
        syncAssociations(item, rawState);
    }

    // example: "extra.customField"
    const pathToValueArray = pathToValue.split(FIELD_KEY_SEPARATOR);

    let objectToUpdate =
        pathToValueArray.length < 2
            ? item
            : pathToValueArray.slice(0, -1).reduce((obj, pathSegment) => {
                if (obj[pathSegment] == null) {
                    obj[pathSegment] = {};
                }

                return obj[pathSegment];
            }, item);

    const fieldName = pathToValueArray[pathToValueArray.length - 1];

    const plainText = state.plainText === true || state.singleLine === true;

    if (plainText) {
        objectToUpdate[
            fieldName
        ] = contentStatePreparedForExport.getPlainText();
    } else {
        objectToUpdate[fieldName] = editor3StateToHtml(
            contentStatePreparedForExport,
        );

        copyEmbeddedArticlesIntoAssociations(contentStatePreparedForExport, item);

        generateAnnotations(item);
    }
}

class Editor3Directive {
    scope: any;
    controllerAs: any;
    controller: any;
    bindToController: any;
    item: any;
    language: any;
    readOnly: any;
    findReplaceTarget: any;
    singleLine: any;
    plainText?: boolean;
    debounce: any;
    bindToValue: any;
    tabindex: any;
    showTitle: any;
    $rootScope: any;
    $scope: any;
    svc: any;
    pathToValue: any;
    limit?: number;
    limitBehavior?: CharacterLimitUiBehavior;
    scrollContainer: any;
    refreshTrigger: any;
    editorFormat?: Array<RICH_FORMATTING_OPTION>;
    cleanPastedHtml?: boolean;
    removeEventListeners?: Array<() => void>;
    fieldId?: string;

    // In most cases a function is called to get the label by ID. This is only required for custom fields.
    fieldLabel?: string;
    required?: boolean;
    validationError?: string;
    validateCharacters?: boolean;
    headerStyles?: boolean;
    helperText: string;

    constructor() {
        this.scope = {};
        this.controllerAs = 'vm';
        this.controller = [
            '$element',
            'editor3',
            '$scope',
            '$rootScope',
            this.initialize,
        ];

        this.bindToController = {
            /**
             * @type {String}
             * @description If set, it will be used to make sure the toolbar is always
             * visible when scrolling. If not set, window object is used as reference.
             * Any valid jQuery selector will do.
             */
            scrollContainer: '@',

            /**
             * @type {Boolean}
             * @description Whether this editor is the target for find & replace
             * operations. The Find & Replace service can only have one editor as
             * target.
             */
            findReplaceTarget: '@',

            /**
             * @type {Object}
             * @description Editor format options that are enabled and should be displayed
             * in the toolbar.
             */
            editorFormat: '=?',

            /**
             * @type {Object}
             * @description A JSON object representing the Content State of the Draft
             * editor. When available, it is used to show content, using `convertFromRaw`.
             * Either this, or value have to be set. Use this for most accurate behavior.
             */
            editorState: '=?',

            /**
             * @type {String}
             * @description HTML value of editor. Used by the outside world.
             */
            value: '=',

            /**
             * @type {String}
             * @description required for editor3 to be able to set metadata for fields. Mainly editor_state
             */
            pathToValue: '=',

            /**
             * @type {Boolean}
             * @description If true, editor is read-only.
             */
            readOnly: '=?',

            /**
             * @type {Boolean}
             * @description If true, the value prop is being watched for changes,
             * and the changes are applied to the editor. Experimental feature used
             * in compare versions.
             */
            bindToValue: '=?',

            /**
             * @type {Number}
             * @description If changed the editor will reload the editor state from item.
             */
            refreshTrigger: '=?',

            /**
             * @type {Function}
             * @description Function that gets called on every content change.
             */
            onChange: '&',

            /**
             * @type {String}
             * @description Spellchecker's language.
             */
            language: '=?',

            /**
             * @type {Boolean}
             * @description Disables the Enter key if the attribute is set.
             */
            singleLine: '=?',

            /**
             * @type {String}
             * @description Number indicating the debounce in ms for the on-change
             * event.
             */
            debounce: '@',

            /**

             * @type {Object}
             * @description Item which is being edited
             */
            item: '=',

            /**
             * @type {Number}
             * @description Tabindex value.
             */
            tabindex: '=?',

            /**
             * @type {Boolean}
             * @description Show image title.
             */
            showTitle: '=?',

            cleanPastedHtml: '=?',

            limit: '=?',

            /**
             * @type {String}
             * @description Force the output to be plain text and not contain any html.
             */
            plainText: '=?',

            fieldId: '=',

            fieldLabel: '=',

            required: '=',

            validationError: '=',

            validateCharacters: '=',

            headerStyles: '=',

            helperText: '=',
        };
    }

    initialize($element, editor3, $scope, $rootScope) {
        if (this.item == null) {
            throw new Error(
                'Item must be provided in order to be able to save editor_state on it',
            );
        }

        const pathValue = this.pathToValue.split(FIELD_KEY_SEPARATOR)[1];

        Promise.all([
            ng.get('preferencesService').get(),
            getAutocompleteSuggestions(this.pathToValue, this.language),
            getLabelNameResolver(),
        ])
            .then((res) => {
                const [userPreferences, autocompleteSuggestions, getLabel] = res;

                // defaults
                this.language = this.language || 'en';
                this.readOnly = this.readOnly || false;
                this.findReplaceTarget =
                    typeof this.findReplaceTarget !== 'undefined';
                this.singleLine = this.singleLine || false;
                this.plainText = this.plainText || false;
                this.debounce = parseInt(this.debounce || '100', 10);
                this.bindToValue = this.bindToValue || false;
                this.tabindex = this.tabindex || 0;
                this.refreshTrigger = this.refreshTrigger || 0;
                this.showTitle = this.showTitle || false;
                this.$rootScope = $rootScope;
                this.$scope = $scope;
                this.svc = {};
                this.limit = this.limit || null;
                this.limitBehavior =
                    userPreferences[AUTHORING_FIELD_PREFERENCES]?.[
                        pathValue || this.pathToValue
                    ]?.characterLimitMode;

                let store = createEditorStore(this, ng.get('spellcheck'), true);

                const fieldName: string | null = (() => {
                    if (this.fieldLabel != null) {
                        return this.fieldLabel;
                    } else if (this.fieldId == null) {
                        return null;
                    } else {
                        return getLabel(this.fieldId);
                    }
                })();

                const renderEditor3 = () => {
                    const element = $element.get(0);

                    ReactDOM.unmountComponentAtNode(element);

                    const textStatistics = (
                        <Spacer h gap="8" alignItems="center" noWrap noGrow>
                            <TextStatisticsConnected />

                            {
                                this.limit != null && (
                                    <CharacterCountConfigButton field={this.fieldId} />
                                )
                            }
                        </Spacer>
                    );

                    const validationErrors = (() => {
                        if (this.validationError != null) {
                            return (
                                <div
                                    className="disallowed-char-error"
                                    style={{float: 'none', margin: 0}}
                                >
                                    {this.validationError}
                                </div>
                            );
                        } else if (this.validateCharacters != null) {
                            return (
                                <div>
                                    <ValidateCharactersConnected fieldId={this.fieldId} />
                                </div>
                            );
                        }
                    })();

                    const editor3 = (
                        <Editor3
                            scrollContainer={this.scrollContainer}
                            singleLine={this.singleLine}
                            cleanPastedHtml={this.cleanPastedHtml}
                            autocompleteSuggestions={autocompleteSuggestions}
                            plainText={this.plainText}
                            canAddArticleEmbed={(srcId: string) => canAddArticleEmbed(srcId, this.item._id)}
                        />
                    );

                    const getTemplateForBody = () => {
                        const labelStyle: React.CSSProperties = {
                            marginBlockEnd: 0,
                        };

                        if (this.validationError != null) {
                            labelStyle.backgroundColor = 'red';
                        }

                        return (
                            <div>
                                <div style={{marginBlockEnd: 15}}>
                                    <Spacer h gap="32" justifyContent="space-between" alignItems="center" noWrap>
                                        <Spacer h gap="8" alignItems="center" noWrap noGrow>
                                            <div className="field__label" style={labelStyle}>{fieldName}</div>

                                            {this.required && (
                                                <span className="sd-required">{gettext('Required')}</span>
                                            )}
                                        </Spacer>

                                        {textStatistics}
                                    </Spacer>

                                    {validationErrors}
                                </div>
                                {editor3}

                                <div className="sd-editor__info-text">{this.helperText}</div>
                            </div>
                        );
                    };

                    const getTemplateForHeader = () => {
                        return (
                            <div style={{display: 'flex'}} className="sd-input-style">
                                <div className="authoring-header__item-label">
                                    {fieldName}
                                    {this.required && (
                                        <span>
                                            &nbsp;
                                            <span
                                                aria-label={gettext('required')}
                                                style={{color: 'red', fontSize: 12}}
                                            >
                                                *
                                            </span>
                                        </span>
                                    )}
                                </div>

                                <div style={{flexGrow: 1}}>
                                    <div>
                                        {editor3}
                                    </div>

                                    <Spacer h gap="32" justifyContent="space-between" alignItems="center" noWrap>
                                        {
                                            validationErrors ?? (
                                                <span
                                                    className="authoring-header__hint"
                                                    style={{margin: 0}}
                                                >
                                                    {this.helperText}
                                                </span>
                                            )}
                                        {textStatistics}
                                    </Spacer>
                                </div>
                            </div>
                        );
                    };

                    ReactDOM.render(
                        <Provider store={store}>
                            <ReactContextForEditor3.Provider value={store}>
                                {(() => {
                                    if (fieldName != null && this.headerStyles === true) {
                                        return getTemplateForHeader();
                                    } else if (fieldName != null && this.headerStyles !== true) {
                                        return getTemplateForBody();
                                    } else {
                                        return editor3;
                                    }
                                })()}
                            </ReactContextForEditor3.Provider>
                        </Provider>,
                        element,
                    );
                };

                window.dispatchEvent(new CustomEvent('editorInitialized'));

                // bind the directive value attribute bi-directionally between Angular and Redux.
                if (this.bindToValue) {
                    $scope.$watch('vm.value', (newValue, oldValue) => {
                        const text = (newValue || '')
                            .replace(/<ins/g, '<code')
                            .replace(/<\/ins>/g, '</code>');
                        const content = getContentStateFromHtml(text);
                        const state = store.getState();
                        const editorState = EditorState.push(
                            state.editorState,
                            content,
                            'insert-characters',
                        );

                        /**
                         * `onChange` handler needs to be skipped, because it is converting
                         * `editorState` to text or HTML and removes diff markup in the process.
                         * It then writes the result to item field and this triggers
                         * this exact watch with `newValue` without diff markup.
                         */
                        const skipOnChangeHandler = true;

                        store.dispatch(changeEditorState(editorState, false, skipOnChangeHandler));
                    });
                }

                // bind the directive refreshTrigger attribute bi-directionally between Angular and Redux.
                $scope.$watch('vm.refreshTrigger', (val, old) => {
                    if (val === 0) {
                        return;
                    }

                    store = createEditorStore(this, ng.get('spellcheck'));

                    renderEditor3();
                });

                $scope.$watch('vm.editorFormat', (editorFormat) => {
                    store.dispatch(setExternalOptions({editorFormat: editorFormat}));
                });

                // this is triggered from MacrosController.call
                // if the current editor is for 'field' replace the current content with 'value'
                $scope.$on(
                    'macro:refreshField',
                    (evt, field, value, options) => {
                        if (field === this.pathToValue) {
                            const _options = Object.assign(
                                {skipOnChange: true},
                                options,
                            );
                            const content = getContentStateFromHtml(value);
                            const state = store.getState();
                            const editorState = EditorState.push(
                                state.editorState,
                                content,
                                'spellcheck-change',
                            );

                            store.dispatch(
                                changeEditorState(
                                    editorState,
                                    true,
                                    _options.skipOnChange,
                                ),
                            );
                        }
                    },
                );

                // bind the directive readOnly attribute bi-directionally between Angular and Redux.
                $scope.$watch('vm.readOnly', (val, old) => {
                    if (val !== old) {
                        store.dispatch(setReadOnly(val));
                    }
                });

                // when validation status changes, increment `refreshTrigger` which will cause editor3 to re-render
                $scope.$watch('vm.validationError', (val, old) => {
                    if (val !== old) {
                        this.refreshTrigger++;
                    }
                });

                // bind the directive limit attribute bi-directionally between Angular and Redux.
                $scope.$watch('vm.limit', (val, old) => {
                    // tslint:disable-next-line:triple-equals
                    if (val != old) { // keep `!=` cause `!==` will trigger with null !== undefined
                        store.dispatch(changeLimitConfig({
                            chars: val,
                            ui: this.limitBehavior,
                        }));
                    }
                });

                // if this editor is the find & replace target, expose the store in the editor3
                // find & replace service.
                if (this.findReplaceTarget) {
                    editor3.setStore(store);
                    $scope.$on('$destroy', editor3.unsetStore);
                }

                const initListeners = () => {
                    // Subscribe to changes on user preferences
                    const userPreferencesListener = addInternalEventListener(
                        'changeUserPreferences',
                        (event) => {
                            const limitBehavior =
                                event.detail?.[AUTHORING_FIELD_PREFERENCES]?.[
                                    pathValue || this.pathToValue
                                ]?.characterLimitMode;

                            if (limitBehavior) {
                                this.limitBehavior = limitBehavior;
                                store.dispatch(
                                    changeLimitConfig({
                                        ui: limitBehavior,
                                        chars: this.limit,
                                    }),
                                );
                            }
                        },
                    );

                    this.removeEventListeners = [userPreferencesListener];
                };

                const removeListeners = () => {
                    this.removeEventListeners.forEach((fn) => fn());
                };

                // Expose the store in the editor3 spellchecker service
                editor3.addSpellcheckerStore(store, this.pathToValue);

                initListeners();

                $scope.$on('$destroy', () => {
                    editor3.removeAllSpellcheckerStores();
                    removeListeners();
                });

                ng.waitForServicesToBeAvailable().then(() => {
                    renderEditor3();
                });

                (findParentScope(
                    $scope,
                    (_scope) => _scope['requestEditor3DirectivesToGenerateHtml'] != null,
                ) as any)?.requestEditor3DirectivesToGenerateHtml?.push(
                    () => generateHtml(store, this.item, this.pathToValue),
                );
            });
    }
}
