import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {useToolbarContext} from './toolbar-context';
import {ToolbarIconButton} from './toolbar-icon-button';

export const PrintPreviewButton: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useToolbarContext<IArticle>();

    return (
        <ToolbarIconButton
            icon="preview-mode"
            label={gettext('Print preview')}
            testId="authoring-print-preview"
            onClick={() => exposed?.printPreview()}
        />
    );
};
