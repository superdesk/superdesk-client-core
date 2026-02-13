import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const CancelAuthoringComponent: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            text={gettext('CANCEL')}
            style="filled"
            type="default"
            onClick={() => exposed?.initiateClosing()}
        />
    );
};
