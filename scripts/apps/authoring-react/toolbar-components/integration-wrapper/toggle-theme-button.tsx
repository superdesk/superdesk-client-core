import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {exposedRef} from './toolbar-context';

export const ToggleThemeButton: React.ComponentType<{entity: IArticle}> = () => (
    <IconButton
        icon="adjust"
        ariaValue={gettext('Toggle theme')}
        onClick={() => exposedRef?.toggleTheme()}
    />
);
