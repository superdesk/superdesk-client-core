import React from 'react';
import {renderComponent} from 'core/ui/utils';
import AttachmentsEditorModal from './AttachmentsEditorModal';

export default function AttachmentsEditorModalDirective() {
    return {
        link: (scope, elem) => {
            renderComponent(
                <AttachmentsEditorModal />,
                scope,
                elem,
            );
        },
    };
}
