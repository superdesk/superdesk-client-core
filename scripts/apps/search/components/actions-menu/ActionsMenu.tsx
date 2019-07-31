import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import MenuItems from './MenuItems';

import {closeActionsMenu, openActionsMenu} from '../../helpers';

export class ActionsMenu extends React.PureComponent<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.stopEvent = this.stopEvent.bind(this);
    }

    toggle(event) {
        this.stopEvent(event);
        closeActionsMenu(this.props.item._id);
        const icon = (ReactDOM.findDOMNode(this) as HTMLElement)
            .getElementsByClassName('icon-dots-vertical')[0];

        openActionsMenu(
            <MenuItems
                svc={this.props.svc}
                scope={this.props.scope}
                item={this.props.item}
                onActioning={this.props.onActioning}
                target={icon}
            />,
            icon,
            this.props.item._id,
        );
    }

    stopEvent(event) {
        event.stopPropagation();
    }

    render() {
        return this.props.template(this.toggle, this.stopEvent);
    }
}

ActionsMenu.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any,
    onActioning: PropTypes.func,
    template: PropTypes.func.isRequired,
};
