import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {exposedRef} from './toolbar-context';

export const ConfigureThemeButton: React.ComponentType<{entity: IArticle}> = () => (
    <IconButton
        icon="switches"
        ariaValue={gettext('Configure themes')}
        onClick={() => exposedRef?.configureTheme()}
    />
);
