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
        <span>{item.organisation}</span> : null;

    info.push(
        <div className="contact-header__container" key="contact-container">
            <h3 key="contact-name">
                <ContactName item={item} />
                {contactJobTitle && <span title={item.job_title}>{contactJobTitle}</span>}
            </h3>
            <div key="contact-org">
                <span className="item-info">{contactOrg}</span>
            </div>
        </div>
    );

    meta.push(
        <li className="simple-list__item simple-list__item--with-icon" key="l-1">
            <span key="2"><i key="2.1" className="icon-envelope" /></span>
            <span key="3">
                {!isEmpty(item.contact_email) && (<ItemContainer item={item} field="contact_email" svc={svc} />)}
            </span>
        </li>
    );

    meta.push(
        <li className="simple-list__item simple-list__item--with-icon" key="l-2">
            <span key="10"><i key="10.1" className="icon-globe" /></span>
            <span key="11">
                {item.website && (<ItemContainer item={item} field="website" svc={svc} />)}
            </span>
        </li>
    );

    meta.push(
        <li className="simple-list__item simple-list__item--with-icon" key="l-3">
            <span key="4"><i key="4.1" className="icon-phone" /></span>
            <span key="5" className="dark">
                {!isEmpty(item.contact_phone) && findKey(item.contact_phone, 'number') &&
                    (<ItemContainer item={item} field="contact_phone" svc={svc} />)
                }
            </span>
        </li>
    );

    meta.push(
        <li className="simple-list__item simple-list__item--with-icon" key="l-4">
            <span key="mobile-dt"><i key="mobile-icon" className="icon-mobile" /></span>
            <span key="mobile-dd" className="dark">
                {!isEmpty(item.mobile) && findKey(item.mobile, 'number') &&
                    (<ItemContainer item={item} field="mobile" svc={svc} />)
                }
            </span>
        </li>
    );

    meta.push(
        <li className="simple-list__item simple-list__item--with-icon" key="l-5">
            <span key="address-dt"><i key="address-link" className="icon-map-marker" /></span>
            <span key="address-dd">
                {item && (<ItemContainer item={item} field="location" svc={svc} />)}
            </span>
        </li>
    );

    info.push(
        <ul className="simple-list simple-list--dotted simple-list--no-border-b simple-list--no-padding-b" key="dl">
            {meta}
            <li className="simple-list__item simple-list__item--with-icon" key="l-6">
                <i key="12.1" className="icon-info-sign"/>
                <span key="12.2">
                    {item.notes && (<Notes item={item} svc={svc} />)}
                </span>
            </li>
        </ul>
    );

    return (
        <div className="sd-grid-item__content" x-ms-format-detection="none">{info}</div>
    );
};

ContactInfo.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
