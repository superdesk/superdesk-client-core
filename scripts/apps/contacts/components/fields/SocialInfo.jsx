import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

/**
 * SocialInfo - to display facebook, twitter etc. information of a contact
 */
export const SocialInfo = ({item, svc}) => (
    <div key="contact-social" className="social-info">
        {item.facebook && <ItemContainer item={item} field="facebook" svc={svc} />}
        {item.twitter && <ItemContainer item={item} field="twitter" svc={svc} />}
    </div>
);

SocialInfo.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object,
};
