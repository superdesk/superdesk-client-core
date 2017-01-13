import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {Editor3} from '../components';
import createStore from '../store';

/**
 * @ngdoc controller
 * @module superdesk.core.editor3
 * @name Editor3Controller
 * @description controller used for sdEditor3, process directive params and initialize&render the
 *  Editor3 react component.
 * @see sdEditor3
 */
Editor3Controller.$inject = ['$element', 'spellcheck', '$injector'];
export function Editor3Controller($element, spellcheck, $injector) {
    const store = createStore(this);

    ReactDOM.render(
        <Provider store={store}>
            <Editor3 />
        </Provider>, $element.get(0)
    );
}
