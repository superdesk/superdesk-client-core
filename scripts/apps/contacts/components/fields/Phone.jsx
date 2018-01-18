import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

export const Phone = ({item, svc}) => <ItemContainer key="phone" field="contact_phone" item={item} svc={svc} />;

Phone.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired
};
