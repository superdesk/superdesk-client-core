import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';
import {ContactName, Notes, JobTitle} from 'apps/contacts/components/fields';
import {isEmpty, findKey} from 'lodash';

/**
 * Media Contact Info - renders contact's information
 */
export const ContactInfo = ({item, svc}) => {
    let meta = [];
    let info = [];

    const contactJobTitle = item.job_title ? <JobTitle item={item} /> : null;
    const contactOrg = item.first_name && item.organisation ?
        <span className="container">{item.organisation}</span> : null;

    info.push(
        <h5 key="contact-name">
            <ContactName item={item} />
            {contactJobTitle && <span title={item.job_title}>{contactJobTitle}</span>}
        </h5>
    );

    if (contactOrg) {
        info.push(
            <div key="contact-org">
                <i className="icon-globe" /><span className="item-info">{contactOrg}</span>
            </div>
        );
    }

    meta.push(
        <dt key="2"><i key="2.1" className="icon-envelope" /></dt>,
        <dd key="3">
            {!isEmpty(item.contact_email) && (<ItemContainer item={item} field="contact_email" svc={svc} />)}
        </dd>
    );

    meta.push(
        <dt key="10"><i key="10.1" className="icon-link" /></dt>,
        <dd key="11">
            {item.website && (<ItemContainer item={item} field="website" svc={svc} />)}
        </dd>
    );

    meta.push(
        <dt key="4"><i key="4.1" className="icon-phone" /></dt>,
        <dd key="5" className="dark">
            {!isEmpty(item.contact_phone) && findKey(item.contact_phone, 'number') &&
                (<ItemContainer item={item} field="contact_phone" svc={svc} />)
            }
        </dd>
    );

    meta.push(
        <dt key="mobile-dt"><i key="mobile-icon" className="icon-mobile" /></dt>,
        <dd key="mobile-dd" className="dark">
            {!isEmpty(item.mobile) && findKey(item.mobile, 'number') &&
                (<ItemContainer item={item} field="mobile" svc={svc} />)
            }
        </dd>
    );

    meta.push(
        <dt key="address-dt"><i key="address-link" className="icon-map-marker" /></dt>,
        <dd key="address-dd">
            {item && (<ItemContainer item={item} field="location" svc={svc} />)}
        </dd>
    );

    info.push(
        <dl key="dl">{meta}</dl>
    );

    info.push(
        <span key="12" className="media notes">
            <i key="12.1" className="icon-info-sign"/>
            <span key="12.2">
                {item.notes && (<Notes item={item} svc={svc} />)}
            </span>
        </span>
    );

    return (
        <div className="media-info" x-ms-format-detection="none">{info}</div>
    );
};

ContactInfo.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
