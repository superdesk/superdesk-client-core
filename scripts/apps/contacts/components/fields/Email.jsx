import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

export const Email = ({item, svc}) => <ItemContainer key="email" field="email" item={item} svc={svc} />;

Email.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired
};
