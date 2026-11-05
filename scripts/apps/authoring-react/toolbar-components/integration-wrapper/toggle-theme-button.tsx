import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {useToolbarContext} from './toolbar-context';
import {ToolbarIconButton} from './toolbar-icon-button';

export const ToggleThemeButton: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useToolbarContext<IArticle>();

    return (
        <ToolbarIconButton
            icon="adjust"
            label={gettext('Toggle theme')}
            testId="authoring-toggle-theme"
            pressed={exposed?.proofreadingEnabled === true}
            onClick={() => exposed?.toggleTheme()}
        />
    );
};
