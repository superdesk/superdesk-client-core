import React from 'react';
import ReactDOM from 'react-dom';

import Label from './Label';
import Divider from './Divider';
import Item from './Item';

import {closeActionsMenu, renderToBody} from 'apps/search/helpers';

export class ActionsMenu extends React.Component {
    constructor(props) {
        super(props);

        this.groups = [
            {_id: 'default', label: gettext('Actions')},
            {_id: 'packaging', label: gettext('Packaging')},
            {_id: 'highlights', label: gettext('Highlights')},
            {_id: 'corrections', label: gettext('Corrections')}
        ];

        this.toggle = this.toggle.bind(this);
        this.getActions = this.getActions.bind(this);
        this.getType = this.getType.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
    }

    toggle(event) {
        this.stopEvent(event);
        closeActionsMenu();
        var icon = ReactDOM.findDOMNode(this)
            .getElementsByClassName('icon-dots-vertical')[0];

        renderToBody(this.renderMenu(), icon);
    }

    stopEvent(event) {
        event.stopPropagation();
    }

    getActions() {
        var item = this.props.item;
        var type = this.getType();
        var intent = {action: 'list', type: type};
        var groups = {};

        const {superdesk, workflowService} = this.props.svc;

        superdesk.findActivities(intent, item).forEach((activity) => {
            if (workflowService.isActionAllowed(item, activity.action)) {
                var group = activity.group || 'default';

                groups[group] = groups[group] || [];
                groups[group].push(activity);
            }
        });
        return groups;
    }

    getType() {
        const {archiveService} = this.props.svc;

        return archiveService.getType(this.props.item);
    }

    renderMenu() {
        var menu = [];
        var item = this.props.item;

        var createAction = (activity) =>
            React.createElement(Item, {
                item: item,
                activity: activity,
                key: activity._id,
                svc: this.props.svc,
                scope: this.props.scope
            });

        var actions = this.getActions();

        this.groups.map((group) => {
            if (actions[group._id]) {
                if (group.label === 'Actions') {
                    menu.push(
                        React.createElement(Label, {
                            label: group.label,
                            key: 'group-label-' + group._id,
                            svc: this.props.svc
                        }),
                        React.createElement(Divider, {
                            key: 'group-divider-' + group._id
                        })
                    );
                } else {
                    menu.push(
                        React.createElement(Divider, {
                            key: 'group-divider-' + group._id
                        }),
                        React.createElement(Label, {
                            label: group.label,
                            key: 'group-label-' + group._id,
                            svc: this.props.svc
                        })
                    );
                }

                menu.push(...actions[group._id].map(createAction));
            }
            return null;
        });

        return React.createElement(
            'ul', {
                className: 'dropdown dropdown__menu more-activity-menu open',
                style: {display: 'block', minWidth: 200}
            }, menu
        );
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
                        onDoubleClick: this.stopEvent
                    },
                    React.createElement('i', {className: 'icon-dots-vertical'})
                )
            )
        );
    }
}

ActionsMenu.propTypes = {
    svc: React.PropTypes.object.isRequired,
    scope: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
};
