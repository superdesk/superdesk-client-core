import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const SaveButtonComponent: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            text={gettext('Save')}
            style="filled"
            type="primary"
            disabled={!exposed?.hasUnsavedChanges()}
            onClick={() => exposed?.save()}
        />
    );
};
