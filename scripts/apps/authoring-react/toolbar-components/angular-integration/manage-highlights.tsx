import React from 'react';
import {IArticle} from 'superdesk-api';
import {IconButton, WithPopover} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {HighlightsCardContent} from '../../toolbar/highlights-management';

export const ManageHighlightsComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <WithPopover
        component={({closePopup}) => (
            <HighlightsCardContent
                close={closePopup}
                article={entity}
            />
        )}
        placement="right-end"
    >
        {(togglePopup) => (
            <IconButton
                onClick={(event) => togglePopup(event.target as HTMLElement)}
                icon={entity.highlights?.length > 1 ? 'multi-star' : 'star'}
                ariaValue={gettext('Highlights')}
            />
        )}
    </WithPopover>
);
