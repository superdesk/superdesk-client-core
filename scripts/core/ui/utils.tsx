import React from 'react';
import {Store} from 'redux';
import {Provider} from 'react-redux';
import {render, unmountComponentAtNode} from 'react-dom';

interface IStoreScope extends ng.IScope {
    store: Store<{}>;
}

/**
 * Render react component and connect it to redux store
 */
export function renderComponent(component: React.ReactElement<any>, scope: IStoreScope, elem: Array<Element>) {
    render(
        <Provider store={scope.store}>
            {component}
        </Provider>,
        elem[0],
    );

    scope.$on('$destroy', () => unmountComponentAtNode(elem[0]));
}
