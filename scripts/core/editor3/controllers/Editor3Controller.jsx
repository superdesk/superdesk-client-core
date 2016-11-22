import React from 'react';
import ReactDOM from 'react-dom';
import {Editor3} from '../components/Editor3';

/**
 * @ngdoc controller
 * @module superdesk.core.editor3
 * @name Editor3Controller
 * @description controller used for sdEditor3, process directive params and initialize&render the
 *  Editor3 react component.
 * @see sdEditor3
 */

Editor3Controller.$inject = ['$element'];
export function Editor3Controller($element) {

    var showToolbar = true;

    if (!this.editorFormat || this.readOnly) {
        showToolbar = false;
    }

    /**
      * @ngdoc method
      * @name Editor3Controller#parentOnChange
      * @param {String} text The current text value from editor.
      * @description Process the change editor state and set the 'value' parameter
      *  for the Editor3 directive.
      */
    this.parentOnChange =  (text) => {
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
            onChange={this.parentOnChange}
            showToolbar={showToolbar}
            editorFormat={this.editorFormat}
            value={this.value} />,
        $element.get(0)
    );
}
