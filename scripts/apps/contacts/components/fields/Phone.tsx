import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

export const Phone: React.StatelessComponent<any> = ({item}) => (
    <div key={`phone-container-${item._id}`} className="container grow">
        {item.contact_phone && <i className="icon-phone" />}
        <ItemContainer field="contact_phone" item={item} />
    </div>
);

Phone.propTypes = {
    item: PropTypes.object,
};
