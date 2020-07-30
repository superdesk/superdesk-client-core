import React from 'react';
import ReactDOM from 'react-dom';
import MenuItems from './MenuItems';

import {closeActionsMenu, openActionsMenu} from '../../helpers';
import {IScopeApply} from 'core/utils';

interface IProps {
    item: any;
    onActioning: any;
    template: any;
    scopeApply: IScopeApply;
}

export class ActionsMenu extends React.PureComponent<IProps> {
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
                scopeApply={this.props.scopeApply}
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
