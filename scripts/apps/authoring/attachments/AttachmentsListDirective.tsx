import React from 'react';
import {renderComponent} from 'core/ui/utils';
import AttachmentsList from './AttachmentsList';

AttachmentsListDirective.$inject = ['$filter'];
export default function AttachmentsListDirective($filter) {
    return {
        link: (scope, elem) => {
            renderComponent(
                <AttachmentsList
                    fileicon={$filter('fileicon')}
                    filesize={$filter('filesize')}
                />,
                scope,
                elem,
            );
        },
    };
}
