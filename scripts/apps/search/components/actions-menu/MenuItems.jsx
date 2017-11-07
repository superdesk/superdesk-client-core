import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import Label from './Label';
import Divider from './Divider';
import Item from './Item';
import {closeActionsMenu, menuHolderElem} from 'apps/search/helpers';

export default class MenuItems extends React.Component {
    constructor(props) {
        super(props);

        this.groups = [
            {_id: 'default', label: gettext('Actions')},
            {_id: 'packaging', label: gettext('Packaging')},
            {_id: 'highlights', label: gettext('Highlights')},
            {_id: 'corrections', label: gettext('Corrections')}
        ];

        this.getActions = this.getActions.bind(this);
        this.getType = this.getType.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true);
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(menuHolderElem());

        if (!domNode || !domNode.contains(event.target)) {
            closeActionsMenu();
            this.props.onClose(true);
        }
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
            <Item key={activity._id}
                svc={this.props.svc}
                scope={this.props.scope}
                item={item} activity={activity}
                onActioning={this.props.onActioning}
                onClose={this.props.onClose} />;

        var actions = this.getActions();

        this.groups.map((group) => {
            if (actions[group._id]) {
                if (group.label === 'Actions') {
                    menu.push(
                        <Label label={group.label} svc={this.props.svc} key={`group-label-${group._id}`} />,
                        <Divider key={`group-divider-${group._id}`} />
                    );
                } else {
                    menu.push(
                        <Divider key={`group-divider-${group._id}`} />,
                        <Label label={group.label} svc={this.props.svc} key={`group-label-${group._id}`} />
                    );
                }

                menu.push(...actions[group._id].map(createAction));
            }
            return null;
        });

        return menu;
    }

    render() {
        return (
            <ul
                className="dropdown dropdown__menu more-activity-menu open"
                style={{display: 'block', minWidth: 200}}>
                {this.renderMenu()}
            </ul>
        );
    }
}

MenuItems.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any,
    onActioning: PropTypes.func,
    onClose: PropTypes.func,
};
