import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Label} from './Label';
import Divider from './Divider';
import Item from './Item';
import SubmenuDropdown from './SubmenuDropdown';
import {AUTHORING_MENU_GROUPS} from '../../../authoring/authoring/constants';
import {closeActionsMenu, menuHolderElem} from '../../helpers';

export default class MenuItems extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

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
            closeActionsMenu(this.props.item._id);
        }
    }

    getActions() {
        var item = this.props.item;
        var type = this.getType();
        var intent = {action: 'list', type: type};
        var groups = {};

        const {superdesk, workflowService} = this.props.svc;

        superdesk.findActivities(intent, item).forEach((activity) => {
            if (workflowService.isActionAllowed(item, activity.action) && activity.list !== false) {
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
            <Item key={activity._id}
                svc={this.props.svc}
                scope={this.props.scope}
                item={item} activity={activity}
                onActioning={this.props.onActioning}
            />;

        var actions = this.getActions();

        AUTHORING_MENU_GROUPS.map((group) => {
            if (actions[group._id]) {
                if (group.label === 'Actions') {
                    menu.push(
                        <Label
                            label={group.label}
                            svc={this.props.svc}
                            key={`group-label-${group._id}`}
                            item={this.props.item} />,
                        <Divider key={`group-divider-${group._id}`} />
                    );
                } else if (group.concate) {
                    const submenu = actions[group._id].map((action) => createAction(action));

                    menu.push(
                        <li key={`group-label-${group._id}`}>
                            <SubmenuDropdown
                                label={gettextCatalog.getString(group.label)}
                                submenu={submenu}
                                icon={actions[group._id][0].icon}
                            />
                        </li>
                    );
                    return null;
                } else {
                    menu.push(<Divider key={`group-divider-${group._id}`} />);
                }

                menu.push(...actions[group._id].map(createAction));
            }

            return null;
        });

        // adding menu item for the groups that are not define above
        Object.keys(actions).forEach((groupName) => {
            var existingGroup = AUTHORING_MENU_GROUPS.find((g) => g._id === groupName);

            if (!existingGroup) {
                menu.push(<Divider key={`group-divider-${groupName}`} />);
                menu.push(...actions[groupName].map(createAction));
            }
        });

        return menu;
    }

    render() {
        return (
            <ul
                className="dropdown dropdown__menu more-activity-menu open"
                style={{display: 'block', minWidth: 200}}
            >{this.renderMenu()}</ul>
        );
    }
}

MenuItems.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any,
    onActioning: PropTypes.func,
};
