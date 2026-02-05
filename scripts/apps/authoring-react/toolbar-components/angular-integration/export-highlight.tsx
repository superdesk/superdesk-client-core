import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const ExportHighlightComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            type="default"
            onClick={() => sdApi.highlights.exportHighlight(
                entity._id,
                exposed?.hasUnsavedChanges() ?? false,
            )}
            text={gettext('Export')}
            style="filled"
        />
    );
};
