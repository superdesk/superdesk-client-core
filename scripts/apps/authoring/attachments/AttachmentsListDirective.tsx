import React from 'react';
import {Store} from 'redux';
import {linkComponent} from 'core/ui/utils';
import AttachmentsList from './AttachmentsList';

interface IScope extends ng.IScope {
    store: Store<{}>;
}

AttachmentsListDirective.$inject = ['$filter'];
export default function AttachmentsListDirective($filter) {
    return {
        link: (scope: IScope, elem: Array<HTMLElement>) => {
            linkComponent(scope, elem, <AttachmentsList
                fileicon={$filter('fileicon')}
                filesize={$filter('filesize')}
            />);
        },
    };
}
