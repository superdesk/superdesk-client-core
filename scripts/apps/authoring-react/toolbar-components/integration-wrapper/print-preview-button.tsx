import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {useToolbarContext} from './toolbar-context';

export const PrintPreviewButton: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useToolbarContext<IArticle>();

    return (
        <IconButton
            icon="preview-mode"
            ariaValue={gettext('Print preview')}
            onClick={() => exposed?.printPreview()}
        />
    );
};
