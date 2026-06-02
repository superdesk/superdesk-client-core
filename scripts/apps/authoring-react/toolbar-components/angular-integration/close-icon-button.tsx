import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const CloseIconButtonComponent: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <IconButton
            ariaValue={gettext('Close')}
            icon="close-small"
            onClick={() => exposed?.initiateClosing()}
            style="outline"
        />
    );
};
