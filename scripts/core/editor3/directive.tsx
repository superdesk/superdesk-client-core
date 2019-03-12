import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {EditorState} from 'draft-js';

import {Editor3} from './components';
import createEditorStore from './store';
import {getInitialContent} from './store';
import {getContentStateFromHtml} from './html/from-html';

import {changeEditorState, setReadOnly} from './actions';

import ng from 'core/services/ng';
/**
 * @ngdoc directive
 * @module superdesk.core.editor3
 * @name sdEditor3
 * @param {Array} editorFormat the formating settings available for editor
 * @param {String} value the model for editor value
 * @param {Boolean} readOnly true if the editor is read only
 * @param {Function} onChange the callback executed when the editor value is changed
 * @param {String} language the current language used for spellchecker
 * @description sdEditor3 integrates react Editor3 component with superdesk app.
 */
export const sdEditor3 = () => new Editor3Directive();

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
    debounce: any;
    disableSpellchecker: any;
    bindToValue: any;
    tabindex: any;
    showTitle: any;
    $rootScope: any;
    $scope: any;
    svc: any;
    pathToValue: any;
    scrollContainer: any;

    constructor() {
        this.scope = {};
        this.controllerAs = 'vm';
        this.controller = ['config', '$element', 'editor3', '$scope', '$rootScope', this.initialize];

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
             * @type {Boolean}
             * @description Disable internal spellchecker.
             */
            disableSpellchecker: '=?',

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
        };
    }

    initialize(config, $element, editor3, $scope, $rootScope) {
        if (this.item == null) {
            throw new Error('Item must be provided in order to be able to save editor_state on it');
        }

        // defaults
        this.language = this.language || 'en';
        this.readOnly = this.readOnly || false;
        this.findReplaceTarget = typeof this.findReplaceTarget !== 'undefined';
        this.singleLine = this.singleLine || false;
        this.debounce = parseInt(this.debounce || '100', 10);
        this.disableSpellchecker = this.disableSpellchecker || false;
        this.bindToValue = this.bindToValue || false;
        this.tabindex = this.tabindex || 0;
        this.showTitle = this.showTitle || false;
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.svc = {};

        const store = createEditorStore(this);

        // bind the directive value attribute bi-directionally between Angular and Redux.
        this.bindToValue && $scope.$watch('vm.value', (newValue, oldValue) => {
            const text = (newValue || '')
                .replace(/<ins/g, '<code')
                .replace(/<\/ins>/g, '</code>');
            const content = getContentStateFromHtml(text);
            const state = store.getState();
            const editorState = EditorState.push(state.editorState, content, 'insert-characters');

            store.dispatch(changeEditorState(editorState));
        });

        // bind the directive refreshTrigger attribute bi-directionally between Angular and Redux.
        $scope.$watch('vm.refreshTrigger', (val, old) => {
            if (val === 0) {
                return;
            }

            const props = {
                item: this.item,
                pathToValue: this.pathToValue,
            };
            const content = getInitialContent(props);
            const state = store.getState();
            const editorState = EditorState.push(state.editorState, content, 'change-block-data');

            store.dispatch(changeEditorState(editorState, true, true));
        });

        // this is triggered from MacrosController.call
        // if the current editor is for 'field' replace the current content with 'value'
        $scope.$on('macro:refreshField', (evt, field, value) => {
            if (field === this.pathToValue) {
                const content = getContentStateFromHtml(value);
                const state = store.getState();
                const editorState = EditorState.push(state.editorState, content, 'change-block-data');

                store.dispatch(changeEditorState(editorState, true, true));
            }
        });

        // bind the directive readOnly attribute bi-directionally between Angular and Redux.
        $scope.$watch('vm.readOnly', (val, old) => {
            if (val !== old) {
                store.dispatch(setReadOnly(val));
            }
        });

        // if this editor is the find & replace target, expose the store in the editor3
        // find & replace service.
        if (this.findReplaceTarget) {
            editor3.setStore(store);
            $scope.$on('$destroy', editor3.unsetStore);
        }

        // Expose the store in the editor3 spellchecker service
        const storeIndex = editor3.addSpellcheckerStore(store);

        $scope.$on('$destroy', () => editor3.removeSpellcheckerStore(storeIndex));

        ng.waitForServicesToBeAvailable()
            .then(() => {
                ReactDOM.render(
                    <Provider store={store}>
                        <Editor3
                            scrollContainer={this.scrollContainer}
                            singleLine={this.singleLine} />
                    </Provider>, $element.get(0),
                );
            });
    }
}
