import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {useToolbarContext} from './toolbar-context';
import {ToolbarIconButton} from './toolbar-icon-button';

export const ConfigureThemeButton: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useToolbarContext<IArticle>();

    return (
        <ToolbarIconButton
            icon="switches"
            label={gettext('Configure themes')}
            testId="authoring-configure-themes"
            onClick={() => exposed?.configureTheme()}
        />
    );
};
