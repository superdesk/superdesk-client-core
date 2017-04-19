import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {Editor3} from './components';
import createStore from './store';

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
    constructor() {
        this.scope = {};
        this.controllerAs = 'vm';
        this.controller = ['$element', 'editor3', '$scope', this.initialize];

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
             * @type {Boolean}
             * @description If true, editor is read-only.
             */
            readOnly: '=?',

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
            singleLine: '@'
        };
    }

    initialize($element, editor3, $scope) {
        // defaults
        this.language = this.language || 'en';
        this.readOnly = this.readOnly || false;
        this.findReplaceTarget = typeof this.findReplaceTarget !== 'undefined';
        this.singleLine = typeof this.singleLine !== 'undefined';

        const store = createStore(this);

        if (this.findReplaceTarget) {
            editor3.setStore(store);
            $scope.$on('$destroy', editor3.unsetStore);
        }

        ReactDOM.render(
            <Provider store={store}>
                <Editor3
                    scrollContainer={this.scrollContainer}
                    singleLine={this.singleLine} />
            </Provider>, $element.get(0)
        );
    }
}
