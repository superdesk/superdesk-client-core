import React from 'react';
import {IArticle} from 'superdesk-api';
import {Label} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

export const ReadOnlyLabelComponent: React.ComponentType<{entity: IArticle}> = () => (
    <Label text={gettext('Read-only')} style="filled" type="warning" />
);
