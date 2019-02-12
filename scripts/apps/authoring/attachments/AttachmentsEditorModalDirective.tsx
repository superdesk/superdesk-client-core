import React from 'react';
import {linkComponent} from 'core/ui/utils';
import AttachmentsEditorModal from './AttachmentsEditorModal';

export default function AttachmentsEditorModalDirective() {
    return {
        link: (scope, elem) => {
            linkComponent(scope, elem, <AttachmentsEditorModal />);
        },
    };
}
