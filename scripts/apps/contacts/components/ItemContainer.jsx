import React from 'react';
import PropTypes from 'prop-types';
import {find} from 'lodash';

export class ItemContainer extends React.Component {
    constructor(props) {
        super(props);

        this.init();
    }

    getPhoneValue(item) {
        return find(item.phone, 'number') ? find(item.phone, 'number').number : null;
    }

    getPhoneTitle(item) {
        return find(item.phone, 'usage') ? find(item.phone, 'usage').usage : null;
    }

    getEmailValue(item) {
        return item.email ? item.email[0] : null;
    }

    init() {
        const {gettextCatalog} = this.props.svc;
        let value, title, altTitle;
        let item, key, _class, _link;

        item = this.props.item;
        key = this.props.field || null;
        _class = 'container';
        _link = _class + ' link';

        switch (key) {
        case 'phone':
            value = this.getPhoneValue(item);
            title = value && gettextCatalog.getString(this.getPhoneTitle(item));
            break;
        case 'email':
            value = this.getEmailValue(item);
            _class = _link;
            break;
        case 'website':
            value = item.website;
            _class = _link;
            break;
        case 'twitter':
            value = item.twitter;
            _class = _link;
            break;
        case 'facebook':
            value = item.facebook;
            _class = _link;
            break;
        }

        altTitle = value ? value : null;

        this.elemProps = {
            key: key,
            className: _class, title: title ? title : altTitle
        };

        this.elemValue = value;
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
    field: PropTypes.string
};
