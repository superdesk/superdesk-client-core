import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {useToolbarContext} from './toolbar-context';

export const ConfigureThemeButton: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useToolbarContext<IArticle>();

    return (
        <IconButton
            icon="switches"
            ariaValue={gettext('Configure themes')}
            onClick={() => exposed?.configureTheme()}
        />
    );
};
