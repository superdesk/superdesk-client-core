import React from 'react';
import {Provider} from 'react-redux';
import {render, unmountComponentAtNode} from 'react-dom';

export function linkComponent(scope, elem, component) {
    render(
        <Provider store={scope.store}>
            {component}
        </Provider>,
        elem[0],
    );

    scope.$on('$destroy', () => unmountComponentAtNode(elem[0]));
}
