import React from 'react';
import PropTypes from 'prop-types';
import {find, join, map} from 'lodash';
import {MAP_URL, TWITTER_URL, MAILTO_URL} from '../../contacts/constants';


export class ItemContainer extends React.Component {
    constructor(props) {
        super(props);

        this.init(props);
    }

    getContactNumber(item, field) {
        return find(item[field], 'number') ? join(map(item[field], 'number'), ', ') : null;
    }

    getContactNumberTitle(item, field) {
        return find(item[field], 'usage') ? join(map(item[field], 'usage'), ', ') : null;
    }

    getEmailValue(item) {
        let emails = map(item.contact_email, (email) => (
            <a href={`${MAILTO_URL}${email}`} title={`${email}`}>{email}</a>
        ));

        return map(emails, (email, i) => (
            <span key={`emails-${i}`}>
                {i > 0 && ', '}
                {email}
            </span>
        ));
    }

    init(props) {
        const {gettextCatalog} = props.svc;
        let value, title, altTitle;
        let item, key, _class, _link;
        let addressInfo = [];

        item = props.item;
        key = props.field || null;
        _class = 'container';
        _link = _class + ' link';

        item.contact_address && addressInfo.push(item.contact_address[0]);
        item.locality && addressInfo.push(item.locality);
        item.city && addressInfo.push(item.city);
        item.contact_state && addressInfo.push(item.contact_state);
        item.postcode && addressInfo.push(item.postcode);
        item.country && addressInfo.push(item.country);

        const contactAddress = addressInfo.join(', ');

        switch (key) {
        case 'contact_phone':
            value = this.getContactNumber(item, key);
            title = value && gettextCatalog.getString(this.getContactNumberTitle(item, key));
            break;
        case 'mobile':
            value = this.getContactNumber(item, key);
            title = value && gettextCatalog.getString(this.getContactNumberTitle(item, key));
            break;
        case 'contact_email':
            value = item.contact_email ? this.getEmailValue(item) : null;
            _class = _link;
            break;
        case 'website':
            value = (<a href={item.website} target="_blank" rel="noopener noreferrer">{item.website}</a>);
            title = value && gettextCatalog.getString(item.website);
            _class = _link;
            break;
        case 'twitter':
            value = (
                <a
                    href={`${TWITTER_URL}${item.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <i className="icon-twitter" />
                </a>
            );
            title = value && gettextCatalog.getString(`${TWITTER_URL}${item.twitter}`);
            _class = _link;
            break;
        case 'facebook':
            value = (
                <a href={item.facebook} target="_blank" rel="noopener noreferrer"><i className="icon-facebook" /></a>
            );
            title = value && gettextCatalog.getString(item.facebook);
            _class = _link;
            break;
        case 'location':
            value = contactAddress ? (<a href={`${MAP_URL}${contactAddress}`} target="_blank" rel="noopener noreferrer">
                {contactAddress}</a>) : null;
            title = value && gettextCatalog.getString(contactAddress);
            _class = _link;
            break;
        }

        altTitle = value ? value : null;

        this.elemProps = {
            key: key,
            className: _class,
            title: title ? title : altTitle,
        };

        this.elemValue = value;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.item !== this.props.item) {
            this.init(nextProps);
        }
    }

    render() {
        return (
            <span {...this.elemProps}>
                {this.elemValue}
            </span>
        );
    }
}

ItemContainer.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
    field: PropTypes.string,
};
