import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {inlineToolbarContext} from './inline-toolbar-context';

export const SaveButtonComponent: React.ComponentType<{entity: IArticle}> = () => (
    <Button
        text={gettext('Save')}
        style="filled"
        type="primary"
        disabled={!inlineToolbarContext.exposed?.hasUnsavedChanges()}
        onClick={() => inlineToolbarContext.exposed?.save()}
    />
);
