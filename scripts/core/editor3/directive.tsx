/* eslint-disable complexity */
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {EditorState} from 'draft-js';
import {Store} from 'redux';

import {Editor3} from './components';
import createEditorStore from './store';
import {getContentStateFromHtml} from './html/from-html';

import {changeEditorState, setReadOnly, changeLimitConfig} from './actions';

import ng from 'core/services/ng';
import {RICH_FORMATTING_OPTION, IRestApiResponse} from 'superdesk-api';
import {addInternalEventListener} from 'core/internal-events';
import {
    CHARACTER_LIMIT_UI_PREF,
    CharacterLimitUiBehavior,
} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {FIELD_KEY_SEPARATOR} from './helpers/fieldsMeta';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {appConfig} from 'appConfig';

function getAutocompleteSuggestions(field: string, language: string): Promise<Array<string>> {
    const supportedFields = ['slugline'];

    if (
        appConfig.archive_autocomplete
        && supportedFields.includes(field)
    ) {
        return httpRequestJsonLocal({
            method: 'GET',
            path: `/archive_autocomplete?field=${field}&language=${language}`,
        }).then((res: IRestApiResponse<{value: string}>) => {
            return res._items.map(({value}) => value);
        });
    } else {
        return Promise.resolve([]);
    }
}

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

export const EditorStore = React.createContext<Store>(null);

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
        ])
            .then((res) => {
                const [userPreferences, autocompleteSuggestions] = res;

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
                    userPreferences[CHARACTER_LIMIT_UI_PREF]?.[
                        pathValue || this.pathToValue
                    ];

                let store = createEditorStore(this, ng.get('spellcheck'));

                const renderEditor3 = () => {
                    const element = $element.get(0);

                    ReactDOM.unmountComponentAtNode(element);

                    ReactDOM.render(
                        <Provider store={store}>
                            <EditorStore.Provider value={store}>
                                <Editor3
                                    scrollContainer={this.scrollContainer}
                                    singleLine={this.singleLine}
                                    cleanPastedHtml={this.cleanPastedHtml}
                                    autocompleteSuggestions={autocompleteSuggestions}
                                    plainText={this.plainText}
                                />
                            </EditorStore.Provider>
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

                        store.dispatch(changeEditorState(editorState));
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
                                event.detail?.[CHARACTER_LIMIT_UI_PREF]?.[
                                    pathValue || this.pathToValue
                                ];

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
            });
    }
}
