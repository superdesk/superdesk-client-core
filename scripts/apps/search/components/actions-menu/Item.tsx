import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {LEFT_SIDEBAR_WIDTH} from 'core/ui/constants';
import {gettext} from 'core/ui/components/utils';

import {closeActionsMenu} from '../../helpers';

export default class Item extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    closeTimeout: any;

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
    }

    updateActioningStatus(isActioning) {
        if (!this.props.item.gone) {
            this.props.onActioning(isActioning);
        }
    }

    run(event) {
        const {scope} = this.props;
        const {activityService} = this.props.svc;

        // Stop event propagation so that click on item action
        // won't select that item for preview/authoring.
        event.stopPropagation();

        this.updateActioningStatus(true);
        scope.$apply(() => {
            activityService.start(this.props.activity, {data: {item: this.props.item}})
                .finally(() => this.updateActioningStatus(false));
        });

        closeActionsMenu(this.props.item._id);
    }

    open() {
        const {$timeout} = this.props.svc;

        $timeout.cancel(this.closeTimeout);
        this.closeTimeout = null;
        if (!this.state.open) {
            this.setPosition();
            this.setState({open: true});
        }
    }

    setPosition() {
        const targetRect = ReactDOM.findDOMNode(this).getBoundingClientRect();
        const BUFFER = 250;

        if (targetRect.left < LEFT_SIDEBAR_WIDTH + BUFFER) {
            this.setState({position: 'dropdown__menu--submenu-right'});
        } else {
            this.setState({position: 'dropdown__menu--submenu-left'});
        }
    }

    close() {
        const {$timeout} = this.props.svc;

        if (this.state.open && !this.closeTimeout) {
            this.closeTimeout = $timeout(() => {
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

    toggle(event) {
        if (!this.state.open) {
            this.open();
        } else {
            this.close();
            this.closeMenu(event);
        }
    }

    componentWillUnmount() {
        const {$timeout} = this.props.svc;

        $timeout.cancel(this.closeTimeout);
        this.closeTimeout = null;
    }

    render() {
        const {$injector} = this.props.svc;

        const activity = this.props.activity;

        const invoke = typeof activity.dropdown === 'function' || typeof activity.dropdown === 'object';

        if (activity.dropdown) {
            return React.createElement(
                'li',
                {onMouseEnter: this.open, onMouseLeave: this.close, onClick: this.toggle},
                React.createElement(
                    'div',
                    {className: 'dropdown dropdown--noarrow' + (this.state.open ? ' open' : '')},
                    React.createElement(
                        'a',
                        {
                            className: 'dropdown__toggle',
                            title: gettext(activity.label),
                        },
                        activity.icon ? React.createElement('i', {
                            className: 'icon-' + activity.icon,
                        }, '') : null,
                        gettext(activity.label),
                    ),
                    this.state.open && invoke ? $injector.invoke(activity.dropdown, activity, {
                        item: this.props.item,
                        className: 'dropdown__menu upward ' + this.state.position,
                        noHighlightsLabel: gettext('No available highlights'),
                        noDesksLabel: gettext('No available desks'),
                        noLanguagesLabel: gettext('No available translations'),
                    }) : null,
                ),
            );
        }

        return React.createElement(
            'li',
            null,
            React.createElement(
                'a',
                {title: gettext(activity.label), onClick: this.run},
                React.createElement('i', {
                    className: 'icon-' + activity.icon,
                }),
                React.createElement('span', {
                    style: {display: 'inline'},
                }, gettext(activity.label)),
            ),
        );
    }
}

Item.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any,
    activity: PropTypes.any,
    onActioning: PropTypes.func,
};
