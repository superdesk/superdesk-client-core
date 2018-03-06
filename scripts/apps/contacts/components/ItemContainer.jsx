import React from 'react';
import PropTypes from 'prop-types';
import {find, join, map} from 'lodash';

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
        return item.contact_email ? join(item.contact_email, ', ') : null;
    }

    init(props) {
        const {gettextCatalog} = props.svc;
        let value, title, altTitle;
        let item, key, _class, _link;

        item = props.item;
        key = props.field || null;
        _class = 'container';
        _link = _class + ' link';

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
    field: PropTypes.string
};
