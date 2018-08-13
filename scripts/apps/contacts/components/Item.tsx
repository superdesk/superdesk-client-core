import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {renderContents} from 'apps/contacts/helpers';

import {
    ListItemInfo,
    ListTypeIcon,
    ContactHeader,
    ContactInfo,
    ContactFooter,
} from 'apps/contacts/components';

/**
 * Contact Item component
 */
export class Item extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    svc: any;

    constructor(props) {
        super(props);

        this.state = {hover: false};
        this.select = this.select.bind(this);
        this.setHoverState = this.setHoverState.bind(this);
        this.unsetHoverState = this.unsetHoverState.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.item !== this.props.item ||
            nextProps.view !== this.props.view ||
            nextProps.flags.selected !== this.props.flags.selected ||
            nextState !== this.state;
    }

    select(event) {
        this.props.onSelect(this.props.item, event);
    }

    setHoverState() {
        this.setState({hover: true});
    }

    unsetHoverState() {
        this.setState({hover: false});
    }

    render() {
        const {item, svc, flags, view, scope} = this.props;

        let contents:any = [
            'div',
            {
                className: classNames(
                    this.props.view === 'photogrid' ?
                        'sd-grid-item sd-grid-item--with-click' :
                        'media-box contacts',
                    {
                        selected: flags.selected,
                    }
                ),
            },
        ];

        if (view === 'photogrid') {
            contents.push(
                <ContactHeader item={item} svc={svc} />,
                <ContactInfo item={item} svc={svc} />,
                <ContactFooter item={item} svc={svc} />
            );
        } else {
            contents.push(
                <ListTypeIcon item={item} svc={svc} />,
                <ListItemInfo item={item} svc={svc} scope={scope} />
            );
        }

        let cssClass = classNames(
            'list-item-view',
            {
                active: flags.selected,
                inactive: !item.is_active,
            }
        );

        return (
            <li id={item._id} key={item._id} className={cssClass}
                onMouseEnter={this.setHoverState}
                onMouseLeave={this.unsetHoverState}
                onClick={this.select}>
                {renderContents(contents)}
            </li>
        );
    }
}

Item.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.object.isRequired,
    item: PropTypes.object,
    flags: PropTypes.object,
    view: PropTypes.string,
    onSelect: PropTypes.func,
};
