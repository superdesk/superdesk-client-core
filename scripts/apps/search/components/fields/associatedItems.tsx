import React from 'react';
import PropTypes from 'prop-types';
import {isEmpty} from 'lodash';
import {AssociatedItemsList} from './AssociatedItemsList';

export const associatedItems: React.StatelessComponent<any> = ({item, svc}) => (
    isEmpty(item.associations) ? null : <AssociatedItemsList key="associatedItems" item={item} svc={svc} />
);

associatedItems.propTypes = {
    item: PropTypes.object.isRequired,
    svc: PropTypes.shape({
        content: PropTypes.object.isRequired,
    }).isRequired,
};
