import React from 'react';
import {IArticle} from 'superdesk-api';
import {NavButton} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {inlineToolbarContext} from './inline-toolbar-context';

export const MinimizeButtonComponent: React.ComponentType<{entity: IArticle}> = () => (
    <NavButton
        text={gettext('Minimize')}
        onClick={() => inlineToolbarContext.exposed?.keepChangesAndClose()}
        icon="minimize"
        iconSize="big"
    />
);
