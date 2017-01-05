import React from 'react';
import ReactDOM from 'react-dom';
import {Editor3} from '../components';

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

    if (!this.editorFormat || this.readOnly) {
        showToolbar = false;
    }

    spellcheck.setLanguage('en');

    /**
      * @ngdoc method
      * @name Editor3Controller#parentOnChange
      * @param {String} text The current text value from editor.
      * @description Process the change editor state and set the 'value' parameter
      *  for the Editor3 directive.
      */
    this.parentOnChange = (text) => {
        if (this.trim) {
            this.value = text.trim();
        } else {
            this.value = text;
        }
        this.onChange();
    };

    ReactDOM.render(
        <Editor3
            readOnly={this.readOnly}
            showToolbar={showToolbar}
            editorFormat={this.editorFormat}
            onChange={this.parentOnChange}
            value={this.value}
            spellchecker={spellcheck}
        />,
        $element.get(0)
    );
}
