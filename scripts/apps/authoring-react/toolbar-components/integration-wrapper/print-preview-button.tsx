import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {exposedRef} from './toolbar-context';

export const PrintPreviewButton: React.ComponentType<{entity: IArticle}> = () => (
    <IconButton
        icon="preview-mode"
        ariaValue={gettext('Print preview')}
        onClick={() => exposedRef?.printPreview()}
    />
);
