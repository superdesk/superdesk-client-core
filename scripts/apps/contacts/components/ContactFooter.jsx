import React from 'react';
import PropTypes from 'prop-types';
import {VersionCreated, SocialInfo} from 'apps/contacts/components/fields';
import {getContactType} from '../../contacts/helpers';
import classNames from 'classnames';

/**
 * Contact footer - renders footer for contact card used in grid view
 */
export const ContactFooter = ({item, svc}) => {
    const {gettextCatalog} = svc;

    const cssClass = classNames(
        'contact-footer',
        {padded: getContactType(item) === 'organisation' || !item.organisation}
    );

    return (
        <div key="contact-footer" className={cssClass}>
            <span className="update-info">
                <dl>
                    <dt>{gettextCatalog.getString('updated:')}</dt>
                    <dd>
                        <VersionCreated item={item} svc={svc} />
                    </dd>
                </dl>
            </span>
            <SocialInfo item={item} svc={svc} />
        </div>
    );
};

ContactFooter.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired
};
