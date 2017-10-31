import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';
import {ContactName, Notes} from 'apps/contacts/components/fields';
import {isEmpty, findKey} from 'lodash';

/**
 * Media Contact Info - renders contact's information
 */
export const ContactInfo = ({item, svc}) => {
    let meta = [];
    let info = [];

    info.push(
        <h5 key="1">
            <ContactName item={item} />
        </h5>
    );

    if (!isEmpty(item.email)) {
        meta.push(
            <dt key="2"><i key="2.1" className="icon-envelope" /></dt>,
            <dd key="3">
                <ItemContainer item={item} field="email" svc={svc} />
            </dd>
        );
    }

    if (!isEmpty(item.phone) && findKey(item.phone, 'number')) {
        meta.push(
            <dt key="4"><i key="4.1" className="icon-phone" /></dt>,
            <dd key="5" className="dark">
                <ItemContainer item={item} field="phone" svc={svc} />
            </dd>
        );
    }

    if (item.twitter) {
        meta.push(
            <dt key="6"><i key="6.1" className="icon-twitter" /></dt>,
            <dd key="7">
                <ItemContainer item={item} field="twitter" svc={svc} />
            </dd>
        );
    }

    if (item.facebook) {
        meta.push(
            <dt key="8"><i key="8.1" className="icon-facebook" /></dt>,
            <dd key="9">
                <ItemContainer item={item} field="facebook" svc={svc} />
            </dd>
        );
    }

    info.push(
        <dl key="dl">{meta}</dl>
    );

    if (item.website) {
        meta.push(
            <dt key="10"><i key="10.1" className="icon-link" /></dt>,
            <dd key="11">
                <ItemContainer item={item} field="website" svc={svc} />
            </dd>
        );
    }

    if (item.notes) {
        info.push(
            <span key="12" className="media notes">
                <i key="12.1" className="icon-info-sign"/>
                <span key="12.2">
                    <Notes item={item} svc={svc} />
                </span>
            </span>
        );
    }

    return (
        <div className="media-info">{info}</div>
    );
};

ContactInfo.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired
};
