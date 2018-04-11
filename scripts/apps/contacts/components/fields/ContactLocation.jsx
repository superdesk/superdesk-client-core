import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';
import {some, isEmpty} from 'lodash';

/**
 * ContactLocation - to display address/location of a contact item
 */
export const ContactLocation = ({item, svc}) => {
    const ADDRESS_FIELDS = ['contact_address', 'locality', 'city', 'contact_state', 'postcode', 'country'];

    let canShow = some(ADDRESS_FIELDS, (field) => !isEmpty(item[field]));

    return (
        <div key="contact-location" className="container link">
            {canShow && <i className="icon-map-marker" />}
            {
                canShow &&
                (<ItemContainer item={item} field="location" svc={svc} />)
            }
        </div>
    );
};

ContactLocation.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object
};
