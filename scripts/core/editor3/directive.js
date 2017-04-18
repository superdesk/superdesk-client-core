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
            scrollContainer: '@',
            config: '=',
            editorFormat: '=',
            language: '=',
            onChange: '&',
            value: '=',
            editorState: '=',
            readOnly: '='
        };
    }

    initialize($element, editor3, $scope) {
        const store = createStore(this);

        editor3.setStore(store);

        ReactDOM.render(
            <Provider store={store}>
                <Editor3 scrollContainer={this.scrollContainer} />
            </Provider>, $element.get(0)
        );
    }
}
