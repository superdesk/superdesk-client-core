import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

export const Email = ({item, svc}) => (
    <div className="container">
        {item.contact_email && <i key="email-icon" className="icon-envelope" />}
        <ItemContainer key="email" field="contact_email" item={item} svc={svc} />
    </div>
);

Email.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
