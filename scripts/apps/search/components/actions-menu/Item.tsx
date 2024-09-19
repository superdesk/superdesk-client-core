import React from 'react';
import ReactDOM from 'react-dom';
import {LEFT_SIDEBAR_WIDTH} from 'core/ui/constants';
import {gettext, IScopeApply} from 'core/utils';
import ng from 'core/services/ng';

import {closeActionsMenu} from '../../helpers';
import {IActivityService} from 'core/activity/activity';
import {sdApi} from 'api';

interface IProps {
    item: any;
    activity: any;
    onActioning: any;
    scopeApply: IScopeApply;
}

interface IState {
    open: boolean;
    position?: string;
}

export default class MenuItem extends React.Component<IProps, IState> {
    closeTimeout: any;

    activityService: IActivityService;
    $timeout: any;
    $injector: any;

    private _mounted: boolean;

    constructor(props) {
        super(props);

        this.state = {open: false};

        this.run = this.run.bind(this);
        this.open = this.open.bind(this);
        this.setPosition = this.setPosition.bind(this);
        this.close = this.close.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.toggle = this.toggle.bind(this);
        this.updateActioningStatus = this.updateActioningStatus.bind(this);

        this.activityService = ng.get('activityService');
        this.$timeout = ng.get('$timeout');
        this.$injector = ng.get('$injector');
    }

    updateActioningStatus(isActioning) {
        if (this._mounted && !this.props.item.gone) {
            this.props.onActioning(isActioning);
        }
    }

    run(event) {
        // Stop event propagation so that click on item action
        // won't select that item for preview/authoring.
        event.stopPropagation();

        this.updateActioningStatus(true);

        sdApi.article.get(this.props.item._id).then((resItem) => {
            this.props.scopeApply(() => {
                this.activityService.start(this.props.activity, {data: {item: resItem}})
                    .finally(() => this.updateActioningStatus(false));
            });

            closeActionsMenu(this.props.item._id);
        });
    }

    open() {
        this.$timeout.cancel(this.closeTimeout);
        this.closeTimeout = null;
        if (!this.state.open) {
            this.setPosition();
            this.setState({open: true});
        }
    }

    setPosition() {
        // eslint-disable-next-line react/no-find-dom-node
        const thisNode = ReactDOM.findDOMNode(this) as HTMLElement;
        const targetRect = thisNode.getBoundingClientRect();
        const BUFFER = 250;

        function focusFirstItem() {
            const btn = thisNode.querySelectorAll('ul')[0]?.querySelectorAll('button:not([disabled])')[0];

            if (btn instanceof HTMLElement) {
                btn.focus();
            }
        }

        if (targetRect.left < LEFT_SIDEBAR_WIDTH + BUFFER) {
            this.setState({position: 'dropdown__menu--submenu-right'}, focusFirstItem);
        } else {
            this.setState({position: 'dropdown__menu--submenu-left'}, focusFirstItem);
        }
    }

    close() {
        if (this.state.open && !this.closeTimeout) {
            this.closeTimeout = this.$timeout(() => {
                this.closeTimeout = null;
                this.setState({open: false});
            }, 100, false);
        }
    }

    closeMenu(event) {
        // called by the onclick event of the submenu dropdown to close actions menu.
        event.stopPropagation();
        closeActionsMenu(this.props.item._id);
    }

    toggle() {
        if (!this.state.open) {
            this.open();
        } else {
            this.close();
        }
    }

    componentDidMount() {
        this._mounted = true;
    }

    componentWillUnmount() {
        this._mounted = false;
        this.$timeout.cancel(this.closeTimeout);
        this.closeTimeout = null;
    }

    render() {
        const activity = this.props.activity;

        const invoke = typeof activity.dropdown === 'function' || typeof activity.dropdown === 'object';

        if (activity.dropdown) {
            return (
                <li
                    onMouseEnter={this.open}
                    onMouseLeave={this.close}
                    onClick={this.toggle}
                >
                    <div className={'dropdown dropdown--noarrow' + (this.state.open ? ' open' : '')}>
                        <button
                            className="dropdown__toggle"
                            title={activity.label}

                            // aria label is needed because playwright treats icon as a character
                            // and can not do an exact match
                            aria-label={activity.label}
                        >
                            {
                                activity.icon
                                    ? (<i className={'icon-' + activity.icon} />)
                                    : null
                            }

                            {activity.label}
                        </button>

                        {
                            this.state.open && invoke
                                ? this.$injector.invoke(activity.dropdown, activity, {
                                    item: this.props.item,
                                    className: 'dropdown__menu upward ' + this.state.position,
                                    noHighlightsLabel: gettext('No available highlights'),
                                    noDesksLabel: gettext('No available desks'),
                                    noLanguagesLabel: gettext('No available translations'),
                                })
                                : null
                        }
                    </div>
                </li>
            );
        }

        return (
            <li>
                <button
                    title={activity.label}
                    onClick={this.run}

                    // aria label is needed because playwright treats icon as a character
                    // and can not do an exact match
                    aria-label={activity.label}
                >
                    {
                        activity.icon
                            ? (<i className={'icon-' + activity.icon} />)
                            : null
                    }

                    <span style={{display: 'inline'}}>
                        {activity.label}
                    </span>
                </button>
            </li>
        );
    }
}
