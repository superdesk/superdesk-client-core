import React from 'react';
import {renderComponent} from 'core/ui/utils';
import AttachmentsList from './AttachmentsList';

AttachmentsListDirective.$inject = [];
export default function AttachmentsListDirective() {
    return {
        link: (scope, elem) => {
            renderComponent(
                <AttachmentsList />,
                scope,
                elem,
            );
        },
    };
}
