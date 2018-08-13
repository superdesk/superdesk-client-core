import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

export const Mobile:React.StatelessComponent<any> = ({item, svc}) =>
    <ItemContainer key="mobile" field="mobile" item={item} svc={svc} />;

Mobile.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
