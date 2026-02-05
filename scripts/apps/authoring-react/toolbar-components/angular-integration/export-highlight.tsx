import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {inlineToolbarContext} from './inline-toolbar-context';

export const ExportHighlightComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        type="default"
        onClick={() => sdApi.highlights.exportHighlight(
            entity._id,
            inlineToolbarContext.exposed?.hasUnsavedChanges() ?? false,
        )}
        text={gettext('Export')}
        style="filled"
    />
);
