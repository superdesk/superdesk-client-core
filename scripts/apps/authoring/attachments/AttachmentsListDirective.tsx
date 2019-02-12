import React from 'react';
import {render, unmoutComponentAtNode} from 'react-dom';
import {Provider} from 'react-redux';

import AttachmentsList from './AttachmentsList';

AttachmentsListDirective.$inject = ['$filter'];
export default function AttachmentsListDirective($filter) {
    return {
        link: (scope, elem) => {
            render(
                <Provider store={scope.store}>
                    <AttachmentsList
                        fileicon={$filter('fileicon')}
                        filesize={$filter('filesize')}
                    />
                </Provider>,
                elem[0]
            );

            scope.$on('$destroy', () => unmoutComponentAtNode(elem[0]));
        },
    };
}
