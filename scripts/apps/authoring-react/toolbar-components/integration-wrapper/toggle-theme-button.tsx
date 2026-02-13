import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {useToolbarContext} from './toolbar-context';

export const ToggleThemeButton: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useToolbarContext<IArticle>();

    return (
        <IconButton
            icon="adjust"
            ariaValue={gettext('Toggle theme')}
            onClick={() => exposed?.toggleTheme()}
        />
    );
};
