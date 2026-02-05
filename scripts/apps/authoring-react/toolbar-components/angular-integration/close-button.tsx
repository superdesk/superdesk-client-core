import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {inlineToolbarContext} from './inline-toolbar-context';

export const CloseButtonComponent: React.ComponentType<{entity: IArticle}> = () => (
    <Button
        text={gettext('Close')}
        style="hollow"
        onClick={() => inlineToolbarContext.exposed?.initiateClosing()}
    />
);
