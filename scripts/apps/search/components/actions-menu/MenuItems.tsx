/* eslint-disable indent */

import React from 'react';
import ReactDOM from 'react-dom';
import Label from './Label';
import Divider from './Divider';
import MenuItem from './Item';
import SubmenuDropdown from './SubmenuDropdown';
import {getAuthoringMenuGroups} from '../../../authoring/authoring/constants';
import {closeActionsMenu, menuHolderElem, positionPopup} from '../../helpers';
import {gettext, IScopeApply} from 'core/utils';
import {IArticle, IArticleAction, IDisplayPriority} from 'superdesk-api';
import {sortByDisplayPriority} from 'core/helpers/sortByDisplayPriority';
import {getArticleActionsFromExtensions} from 'core/superdesk-api-helpers';
import ng from 'core/services/ng';

interface IProps {
    item: IArticle;
    scopeApply: IScopeApply;
    onActioning: any;
    target?: Element;
}

interface IState {
    actionsFromExtensions: Array<IArticleAction> | null;
}

export default class MenuItems extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    superdesk: any;
    workflowService: any;
    archiveService: any;

    constructor(props) {
        super(props);

        this.getActions = this.getActions.bind(this);
        this.getType = this.getType.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.state = {
            actionsFromExtensions: null,
        };

        this.superdesk = ng.get('superdesk');
        this.workflowService = ng.get('workflowService');
        this.archiveService = ng.get('archiveService');
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);

        // actions(except viewing an item) are not allowed for items in legal archive
        if (this.props.item._type !== 'legal_archive') {
            getArticleActionsFromExtensions(this.props.item).then((actions) => {
                this.setState({
                    actionsFromExtensions: actions,
                });
            });
        }
    }

    componentDidUpdate() {
        if (this.props.target != null) {
            positionPopup(this.props.target);
        }
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
        const item = this.props.item;
        const type = this.getType();
        const intent = {action: 'list', type: type};
        const groups = {};

        this.superdesk.findActivities(intent, item).forEach((activity) => {
            if (this.workflowService.isActionAllowed(item, activity.action) && activity.list !== false) {
                const group = activity.group || 'default';

                groups[group] = groups[group] || [];
                groups[group].push(activity);
            }
        });
        return groups;
    }

    getType() {
        return this.archiveService.getType(this.props.item);
    }

    renderMenu() {
        const item = this.props.item;

        const createAction = (activity) => ({
            label: activity.label,
            element: (
                <MenuItem
                    key={activity._id}
                    item={item}
                    activity={activity}
                    onActioning={this.props.onActioning}
                    scopeApply={this.props.scopeApply}
                />
            ),
        });

        const actions = this.getActions();

        var groupedItems: {
            [groupLabel: string]: Array<{
                label: string;
                priority?: IDisplayPriority;
                element: JSX.Element;
            }>;
        } = {};

        const moveActionsToDefaultGroup = ['Planning', 'duplicate'];

        getAuthoringMenuGroups().forEach((group) => {
            const realGroupId = group._id;
            const stackGroupId = moveActionsToDefaultGroup.includes(group._id) ? 'default' : group._id;

            if (actions[realGroupId]) {
                if (groupedItems[stackGroupId] == null) {
                    groupedItems[stackGroupId] = [];
                }

                if (group.concate) {
                    const submenu = actions[realGroupId].map((action) => createAction(action).element);

                    groupedItems[stackGroupId].push({
                        label: group.label,
                        element: (
                            <li key={`group-id-${stackGroupId}`}>
                                <SubmenuDropdown
                                    label={gettext(group.label)}
                                    submenu={submenu}
                                    icon={group.icon ? group.icon : null}
                                />
                            </li>
                        ),
                    });
                    return;
                }

                actions[stackGroupId].map(createAction).forEach(({label, element}) => {
                    groupedItems[stackGroupId].push({
                        label,
                        element,
                    });
                });
            }
        });

        // adding menu items for the groups that are not defined above
        Object.keys(actions).forEach((groupId) => {
            const existingGroup = getAuthoringMenuGroups().find((g) => g._id === groupId);

            if (!existingGroup) {
                const finalGroupId = moveActionsToDefaultGroup.includes(groupId) ? 'default' : groupId;

                if (groupedItems[finalGroupId] == null) {
                    groupedItems[finalGroupId] = [];
                }

                actions[groupId].map(createAction).forEach(({label, element}) => {
                    groupedItems[finalGroupId].push({label, element});
                });
            }
        });

        this.state.actionsFromExtensions.forEach((action, i) => {
            const element = (
                <li key={`extension-item-${i}`}>
                    <button onClick={() => {
                        closeActionsMenu(this.props.item._id);
                        action.onTrigger();
                    }}>
                        {action.icon == null ? null : <i className={action.icon} />}
                        {action.label}
                    </button>
                </li>
            );
            const {priority} = action;

            if (action.groupId == null) {
                if (groupedItems['default'] == null) {
                    groupedItems['default'] = [];
                }
                groupedItems['default'].push({label: action.label, element, priority});
            } else {
                if (groupedItems[action.groupId] == null) {
                    groupedItems[action.groupId] = [];
                }

                groupedItems[action.groupId].push({label: action.label, element, priority});
            }
        });

        var menu: Array<JSX.Element> = [];

        Object.values(groupedItems).forEach((group, i) => {
            if (i !== 0) {
                menu.push(<Divider key={`group-divider-${i}`} />);
            }

            sortByDisplayPriority(group).forEach(({element}) => {
                menu.push(element);
            });
        });

        return menu;
    }

    render() {
        if (this.state.actionsFromExtensions == null || this.renderMenu().length < 1) {
            return null;
        }

        return (
            <ul
                className="dropdown dropdown__menu more-activity-menu open"
                style={{display: 'block', minWidth: 200}}
                data-test-id="context-menu"
            >
                <Label
                    label={gettext('Actions')}
                    item={this.props.item}
                />
                {this.renderMenu()}
            </ul>
        );
    }
}
