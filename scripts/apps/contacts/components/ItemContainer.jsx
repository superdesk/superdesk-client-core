import React from 'react';
import PropTypes from 'prop-types';
import {find, join, map} from 'lodash';

export class ItemContainer extends React.Component {
    constructor(props) {
        super(props);

        this.init();
    }

    getContactNumber(item, field) {
        return find(item[field], 'number') ? join(map(item[field], 'number'), ', ') : null;
    }

    getContactNumberTitle(item, field) {
        return find(item[field], 'usage') ? join(map(item[field], 'usage'), ', ') : null;
    }


    getEmailValue(item) {
        return item.email ? join(item.email, ', ') : null;
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
            value = this.getContactNumber(item, key);
            title = value && gettextCatalog.getString(this.getContactNumberTitle(item, key));
            break;
        case 'mobile':
            value = this.getContactNumber(item, key);
            title = value && gettextCatalog.getString(this.getContactNumberTitle(item, key));
            break;
        case 'email':
            value = this.getEmailValue(item);
            _class = _link;
            break;
        case 'website':
            value = (<a href={item.website} target="_blank">{item.website}</a>);
            title = value && gettextCatalog.getString(item.website);
            _class = _link;
            break;
        case 'twitter':
            value = item.twitter;
            _class = _link;
            break;
        case 'facebook':
            value = (<a href={item.facebook} target="_blank">{item.facebook}</a>);
            title = value && gettextCatalog.getString(item.facebook);
            _class = _link;
            break;
        }

        altTitle = value ? value : null;

        this.elemProps = {
            key: key,
            className: _class,
            title: title ? title : altTitle
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
