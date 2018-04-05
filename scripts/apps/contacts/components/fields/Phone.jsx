import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

export const Phone = ({item, svc}) => (
    <div className="container grow">
        {item.contact_phone && <i key="phone-icon" className="icon-phone" />}
        <ItemContainer key="phone" field="contact_phone" item={item} svc={svc} />
    </div>
);

Phone.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired
};
