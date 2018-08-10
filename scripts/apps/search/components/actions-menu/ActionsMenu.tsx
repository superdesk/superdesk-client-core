import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import MenuItems from './MenuItems';

import {closeActionsMenu, openActionsMenu} from '../../helpers';

export class ActionsMenu extends React.Component {
    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.stopEvent = this.stopEvent.bind(this);
    }

    toggle(event) {
        this.stopEvent(event);
        closeActionsMenu(this.props.item._id);
        var icon = ReactDOM.findDOMNode(this)
            .getElementsByClassName('icon-dots-vertical')[0];

        openActionsMenu(<MenuItems
            svc={this.props.svc}
            scope={this.props.scope}
            item={this.props.item}
            onActioning={this.props.onActioning}/>, icon, this.props.item._id);
    }

    stopEvent(event) {
        event.stopPropagation();
    }

    render() {
        return React.createElement(
            'div',
            {className: 'item-right toolbox'},

            React.createElement(
                'div',
                {className: 'item-actions-menu dropdown--big open'},
                React.createElement(
                    'button',
                    {
                        className: 'more-activity-toggle condensed dropdown__toggle',
                        onClick: this.toggle,
                        onDoubleClick: this.stopEvent,
                    },
                    React.createElement('i', {className: 'icon-dots-vertical'})
                )
            )
        );
    }
}

ActionsMenu.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any,
    onActioning: PropTypes.func,
};
