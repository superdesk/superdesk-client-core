import React from 'react';
import {VersionCreated, SocialInfo} from 'apps/contacts/components/fields';
import {getContactType} from '../../contacts/helpers';
import classNames from 'classnames';
import {gettext} from 'core/utils';
import {IContact} from 'superdesk-api';

interface IProps {
    item: IContact;
    svc: any;
}
/**
 * Contact footer - renders footer for contact card used in grid view
 */
export const ContactFooter: React.FunctionComponent<IProps> = ({item, svc}) => {
    const cssClass = classNames(
        'sd-grid-item__footer sd-grid-item__footer--padded',
        {padded: getContactType(item) === 'organisation' || !item.organisation},
    );

    return (
        <div key="contact-footer" className={cssClass}>
            <span className="update-info">
                <span className="sd-grid-item__text-label">{gettext('Updated:')}</span>
                <VersionCreated item={item} svc={svc} />
            </span>
            <SocialInfo item={item} />
        </div>
    );
};
