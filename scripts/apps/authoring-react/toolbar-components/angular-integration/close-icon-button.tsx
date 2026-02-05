import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton} from 'superdesk-ui-framework/react';
import {inlineToolbarContext} from './inline-toolbar-context';

export const CloseIconButtonComponent: React.ComponentType<{entity: IArticle}> = () => (
    <IconButton
        ariaValue="Close"
        icon="close-small"
        onClick={() => inlineToolbarContext.exposed?.initiateClosing()}
        style="outline"
    />
);
