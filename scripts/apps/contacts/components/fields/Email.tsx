import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

export const Email: React.StatelessComponent<any> = ({item}) => (
    <div key={`email-container-${item._id}`} className="container">
        {item.contact_email && <i key="email-icon" className="icon-envelope" />}
        <ItemContainer key="email" field="contact_email" item={item} />
    </div>
);

Email.propTypes = {
    item: PropTypes.object,
};
