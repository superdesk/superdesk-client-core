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
        'sd-grid-item__footer sd-grid-item__footer--padded',
        {padded: getContactType(item) === 'organisation' || !item.organisation}
    );

    return (
        <div key="contact-footer" className={cssClass}>
            <span className="update-info">
                <span className="sd-grid-item__text-label">{gettextCatalog.getString('Updated:')}</span>
                <VersionCreated item={item} svc={svc} />
            </span>
            <SocialInfo item={item} svc={svc} />
        </div>
    );
};

ContactFooter.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
