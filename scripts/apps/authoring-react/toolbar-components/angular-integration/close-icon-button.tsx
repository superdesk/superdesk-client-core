import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';

// Square and hollow rather than a round `IconButton`, so it sits beside the save button the way
// angular's `#closeAuthoringBtn` does.
export const CloseIconButtonComponent: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            text={gettext('Close')}
            tooltip={gettext('Close')}
            icon="close-small"
            iconOnly
            shape="square"
            style="hollow"
            onClick={() => exposed?.initiateClosing()}
        />
    );
};
