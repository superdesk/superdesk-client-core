/* eslint-disable indent */

import React from 'react';
import ReactDOM from 'react-dom';
import Label from './Label';
import Divider from './Divider';
import Item from './Item';
import SubmenuDropdown from './SubmenuDropdown';
import {AUTHORING_MENU_GROUPS} from '../../../authoring/authoring/constants';
import {closeActionsMenu, menuHolderElem, positionPopup} from '../../helpers';
import {gettext} from 'core/utils';
import {IExtensionActivationResult, IArticle, IArticleAction, IDisplayPriority} from 'superdesk-api';
import {extensions} from 'core/extension-imports.generated';
import {flatMap} from 'lodash';
import {sortByDisplayPriority} from 'core/helpers/sortByDisplayPriority';

interface IProps {
    item: IArticle;
    svc: any;
    scope: any;
    onActioning: any;
    target?: Element;
}

interface IState {
    actionsFromExtensions: Array<IArticleAction> | null;
}

export default class MenuItems extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.getActions = this.getActions.bind(this);
        this.getType = this.getType.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.state = {
            actionsFromExtensions: null,
        };
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);

        const getActionsFromExtensions
            : Array<IExtensionActivationResult['contributions']['entities']['article']['getActions']>
            = flatMap(
                Object.values(extensions).map(({activationResult}) => activationResult),
                (activationResult) =>
                    activationResult.contributions != null
                    && activationResult.contributions.entities != null
                    && activationResult.contributions.entities.article != null
                    && activationResult.contributions.entities.article.getActions != null
                        ? activationResult.contributions.entities.article.getActions
                        : [],
            );

        Promise.all(getActionsFromExtensions.map((getPromise) => getPromise(this.props.item))).then((res) => {
            this.setState({
                actionsFromExtensions: flatMap(res),
            });
        });
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

        const {superdesk, workflowService} = this.props.svc;

        superdesk.findActivities(intent, item).forEach((activity) => {
            if (workflowService.isActionAllowed(item, activity.action) && activity.list !== false) {
                const group = activity.group || 'default';

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
        const item = this.props.item;

        const createAction = (activity) => ({
            label: activity.label,
            element: (
                <Item key={activity._id}
                    svc={this.props.svc}
                    scope={this.props.scope}
                    item={item} activity={activity}
                    onActioning={this.props.onActioning}
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

        AUTHORING_MENU_GROUPS.forEach((group) => {
            const groupId = moveActionsToDefaultGroup.includes(group._id) ? 'default' : group._id;

            if (actions[groupId]) {
                if (groupedItems[groupId] == null) {
                    groupedItems[groupId] = [];
                }

                if (group.concate) {
                    const submenu = actions[groupId].map((action) => createAction(action).element);

                    groupedItems[groupId].push({
                        label: group.label,
                        element: (
                            <li key={`group-id-${groupId}`}>
                                <SubmenuDropdown
                                    label={gettext(group.label)}
                                    submenu={submenu}
                                    icon={actions[groupId][0].icon}
                                />
                            </li>
                        ),
                    });
                    return;
                }

                actions[groupId].map(createAction).forEach(({label, element}) => {
                    groupedItems[groupId].push({
                        label,
                        element,
                    });
                });
            }
        });

        // adding menu items for the groups that are not defined above
        Object.keys(actions).forEach((groupId) => {
            const existingGroup = AUTHORING_MENU_GROUPS.find((g) => g._id === groupId);

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
