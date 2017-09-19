import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import Label from './Label';
import Divider from './Divider';
import Item from './Item';

import {closeActionsMenu, renderToBody} from 'apps/search/helpers';

export class ActionsMenu extends React.Component {
    constructor(props) {
        super(props);

        this.groups = [
            {_id: 'default', label: gettext('Actions')},
            {_id: 'duplicate', label: gettext('Duplicate'), concate: true},
            {_id: 'packaging'},
            {_id: 'highlights'},
            {_id: 'corrections'}
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
        const {gettextCatalog} = this.props.svc;

        var menu = [];
        var item = this.props.item;

        var createAction = (activity) =>
            React.createElement(Item, {
                item: item,
                activity: activity,
                key: activity._id,
                svc: this.props.svc,
                scope: this.props.scope,
                onActioning: this.props.onActioning
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
                } else if (group.concate) {
                    var submenu = [];

                    actions[group._id].forEach((action) =>
                        submenu.push(createAction(action)));

                    menu.push(
                        React.createElement('li', {key: 'group-label' + group._id},
                            React.createElement('div',
                                {className: 'dropdown dropdown--noarrow'},
                                React.createElement('a', {
                                    className: 'dropdown__toggle',
                                    title: gettextCatalog.getString(group.label)
                                }, actions[group._id][0].icon ? React.createElement('i', {
                                    className: 'icon-' + actions[group._id][0].icon
                                }, '') : null,
                                gettextCatalog.getString(group.label)
                                ), React.createElement('ul',
                                    {className: 'dropdown__menu dropdown__menu--submenu-left'},
                                    submenu
                                )))
                    );
                    return null;
                } else {
                    menu.push(
                        React.createElement(Divider, {
                            key: 'group-divider-' + group._id
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
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any,
    onActioning: PropTypes.func
};
