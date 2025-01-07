import React, {FunctionComponent} from 'react';
import {gettext} from 'core/utils';
import {IContact} from 'superdesk-api';

/**
 * Contact header - renders header for contact card used in grid view
 */
export const ContactHeader: FunctionComponent<{item: IContact}> = ({item}) => {
    const typeTooltip = item.first_name ? gettext('Person Contact') : gettext('Organisation Contact');

    return (
        <div
            className="contact__type-icon"
            key="contact-header"
            data-sd-tooltip={item.public ? typeTooltip : typeTooltip + ' ' + gettext('(Private)')}
            data-flow="right"
        >
            <i className={`${item.first_name ? 'icon-user' : 'icon-business'}`} />
        </div>
    );
};
