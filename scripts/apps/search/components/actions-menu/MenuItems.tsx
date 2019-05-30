import React from 'react';
import ReactDOM from 'react-dom';
import Label from './Label';
import Divider from './Divider';
import Item from './Item';
import SubmenuDropdown from './SubmenuDropdown';
import {AUTHORING_MENU_GROUPS} from '../../../authoring/authoring/constants';
import {closeActionsMenu, menuHolderElem, positionPopup} from '../../helpers';
import {gettext} from 'core/utils';
import {IExtensionActivationResult, IArticle, IArticleAction} from 'superdesk-api';
import {extensions} from 'core/extension-imports.generated';
import {flatMap} from 'lodash';

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
        const menu: Array<JSX.Element> = [];
        const item = this.props.item;

        const createAction = (activity) =>
            <Item key={activity._id}
                svc={this.props.svc}
                scope={this.props.scope}
                item={item} activity={activity}
                onActioning={this.props.onActioning}
            />;

        const actions = this.getActions();

        AUTHORING_MENU_GROUPS.forEach((group) => {
            if (actions[group._id]) {
                if (group.label === 'Actions') {
                    menu.push(
                        <Label
                            label={group.label}
                            key={`group-label-${group._id}`}
                            item={this.props.item} />,
                        <Divider key={`group-divider-${group._id}`} />,
                    );
                } else if (group.concate) {
                    const submenu = actions[group._id].map((action) => createAction(action));

                    menu.push(
                        <li key={`group-label-${group._id}`}>
                            <SubmenuDropdown
                                label={gettext(group.label)}
                                submenu={submenu}
                                icon={actions[group._id][0].icon}
                            />
                        </li>,
                    );
                    return;
                } else {
                    menu.push(<Divider key={`group-divider-${group._id}`} />);
                }

                menu.push(...actions[group._id].map(createAction));
            }
        });

        // adding menu items for the groups that are not defined above
        Object.keys(actions).forEach((groupName) => {
            const existingGroup = AUTHORING_MENU_GROUPS.find((g) => g._id === groupName);

            if (!existingGroup) {
                menu.push(<Divider key={`group-divider-${groupName}`} />);
                menu.push(...actions[groupName].map(createAction));
            }
        });

        this.state.actionsFromExtensions.forEach((action, i) => {
            menu.push((
                <li key={`extension-item-${i}`}>
                    <button onClick={action.onTrigger}>
                        {action.icon == null ? null : <i className={action.icon} />}
                        {action.label}
                    </button>
                </li>
            ));
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
                {this.renderMenu()}
            </ul>
        );
    }
}
