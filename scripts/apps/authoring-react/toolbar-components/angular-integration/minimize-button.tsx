import React from 'react';
import {IArticle} from 'superdesk-api';
import {NavButton} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const MinimizeButtonComponent: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <NavButton
            text={gettext('Minimize')}
            onClick={() => exposed?.keepChangesAndClose()}
            icon="minimize"
            iconSize="big"
        />
    );
};
