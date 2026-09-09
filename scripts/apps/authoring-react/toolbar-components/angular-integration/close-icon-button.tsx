import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';

/**
 * The icon-only close control. Square and hollow to sit beside the save button the way
 * authoring-angular's `#closeAuthoringBtn` does, rather than as a round icon button.
 */
export const CloseIconButtonComponent: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            text={gettext('Close')}
            icon="close-small"
            iconOnly
            shape="square"
            style="hollow"
            onClick={() => exposed?.initiateClosing()}
        />
    );
};
