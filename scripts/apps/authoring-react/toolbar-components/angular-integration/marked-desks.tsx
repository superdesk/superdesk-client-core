import React from 'react';
import {IArticle} from 'superdesk-api';
import {NavButton, Popover} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {MarkedDesks} from '../../toolbar/mark-for-desks/mark-for-desks-popover';

export const MarkedDesksComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <>
        <Popover
            triggerSelector="#marked-for-desks"
            title={gettext('Marked for')}
            placement="bottom-end"
        >
            <MarkedDesks article={entity} />
        </Popover>
        <NavButton
            onClick={() => null}
            id="marked-for-desks"
            icon="bell"
            iconSize="small"
        />
    </>
);
