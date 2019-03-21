import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {closeActionsMenu, renderToBody} from '../helpers';

let closeTimeout;

export class DesksDropdown extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {open: false};

        this.close = this.close.bind(this);
        this.toggle = this.toggle.bind(this);
        this.renderDropdown = this.renderDropdown.bind(this);
    }

    close(cancel) {
        const {$timeout} = this.props.svc;

        if (cancel === true && closeTimeout) {
            $timeout.cancel(closeTimeout);
        } else {
            closeTimeout = $timeout(() => {
                closeActionsMenu();
            }, 200, false);
        }
    }

    toggle(event) {
        if (event) {
            event.stopPropagation();
        }

        this.close(true);
        this.renderDropdown();
    }

    render() {
        return React.createElement('dd',
            {className: 'dropdown dropdown--dropup more-actions'},
            React.createElement('button', {
                className: 'dropdown__toggle',
                onMouseOver: this.toggle,
                onMouseLeave: this.close,
            },
            React.createElement('i',
                {className: 'icon-dots'}),
            ));
    }

    renderDropdown() {
        const desks = this.props.desks.map((desk, index) => React.createElement(
            'li',
            {key: 'desk' + index},
            React.createElement(
                'a',
                {disabled: !desk.isUserDeskMember, onClick: this.props.openDesk(desk)},
                desk.desk.name + ' (' + desk.count + ')',
            ),
        ));

        const elem = React.createElement('div', {
            className: 'dropdown__menu more-activity-menu',
            onMouseOver: this.toggle,
            onMouseLeave: this.close,
        }, React.createElement('ul', {}, desks));

        const thisNode = ReactDOM.findDOMNode(this) as HTMLElement;
        const icon = thisNode.getElementsByClassName('dropdown__toggle')[0];

        renderToBody(elem, icon);
    }
}

DesksDropdown.propTypes = {
    svc: PropTypes.object.isRequired,
    openDesk: PropTypes.func,
    desks: PropTypes.any,
};
