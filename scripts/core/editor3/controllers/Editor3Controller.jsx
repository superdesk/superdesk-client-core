import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {Editor3, getInitialState} from '../components';
import editorReducers from '../reducers';

/**
 * @ngdoc controller
 * @module superdesk.core.editor3
 * @name Editor3Controller
 * @description controller used for sdEditor3, process directive params and initialize&render the
 *  Editor3 react component.
 * @see sdEditor3
 */

Editor3Controller.$inject = ['$element', 'spellcheck'];
export function Editor3Controller($element, spellcheck) {
    let showToolbar = true;
    let singleLine = false;

    /**
      * @ngdoc method
      * @name Editor3Controller#onChangeValue
      * @param {String} text The current text value from editor.
      * @description Process the change editor state and set the 'value' parameter
      *  for the Editor3 directive.
      */
    this.onChangeValue = (text) => {
        if (this.trim) {
            this.value = text.trim();
        } else {
            this.value = text;
        }
        this.onChange();
    };

    if (!this.editorFormat || this.readOnly) {
        showToolbar = false;
        singleLine = true;
    }

    spellcheck.setLanguage(this.language);
    spellcheck.getDict();
    const initialState = getInitialState(
        spellcheck,
        this.value,
        this.onChangeValue,
        this.readOnly,
        showToolbar,
        singleLine,
        this.editorFormat
    );

    let store = createStore(editorReducers, initialState);

    ReactDOM.render(
        <Provider store={store}>
            <Editor3 />
        </Provider>,
        $element.get(0)
    );
}
