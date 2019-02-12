import React from 'react';
import {Provider} from 'react-redux';
import {render, unmountComponentAtNode} from 'react-dom';

import AttachmentsList from './AttachmentsList';

interface IScope extends ng.IScope {
    store: {};
}

AttachmentsListDirective.$inject = ['$filter'];
export default function AttachmentsListDirective($filter) {
    return {
        link: (scope: IScope, elem: Array<HTMLElement>) => {
            render(
                <Provider store={scope.store}>
                    <AttachmentsList
                        fileicon={$filter('fileicon')}
                        filesize={$filter('filesize')}
                    />
                </Provider>,
                elem[0],
            );

            scope.$on('$destroy', () => unmountComponentAtNode(elem[0]));
        },
    };
}
