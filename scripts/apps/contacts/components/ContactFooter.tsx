import React from 'react';
import {SocialInfo} from 'apps/contacts/components/fields';
import {gettext} from 'core/utils';
import {IContact} from 'superdesk-api';
import {DateTime} from 'core/ui/components/DateTime';
import {Spacer} from 'superdesk-ui-framework/react';

interface IProps {
    item: IContact;
}
/**
 * Contact footer - renders footer for contact card used in grid view
 */
export const ContactFooter: React.FunctionComponent<IProps> = ({item}) => {
    return (
        <Spacer style={{padding: 8}} h gap="4" justifyContent="start" alignItems="center" noGrow>
            <Spacer h gap="4" justifyContent="start" alignItems="center" noWrap>
                <span className="sd-grid-item__text-label">{gettext('Updated:')}</span>
                <DateTime dateTime={item._updated} />
            </Spacer>
            <SocialInfo item={item} />
        </Spacer>
    );
};
