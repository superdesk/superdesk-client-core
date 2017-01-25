import React from 'react';
import ReactDOM from 'react-dom';

import {closeActionsMenu} from 'apps/search/helpers';

export default class Item extends React.Component {
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

        closeActionsMenu();
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
        var targetRect = ReactDOM.findDOMNode(this).getBoundingClientRect();
        var LEFT_BAR_WIDTH = 48;
        var BUFFER = 250;

        if (targetRect.left < LEFT_BAR_WIDTH + BUFFER) {
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
        closeActionsMenu();
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
        const {gettextCatalog, $injector} = this.props.svc;

        var activity = this.props.activity;

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
                            title: gettextCatalog.getString(activity.label)
                        },
                        activity.icon ? React.createElement('i', {
                            className: 'icon-' + activity.icon
                        }, '') : null,
                        gettextCatalog.getString(activity.label)
                    ),
                    this.state.open ? $injector.invoke(activity.dropdown, activity, {
                        item: this.props.item,
                        className: 'dropdown__menu upward ' + this.state.position,
                        noHighlightsLabel: gettextCatalog.getString('No available highlights'),
                        noDesksLabel: gettextCatalog.getString('No available desks'),
                        noLanguagesLabel: gettextCatalog.getString('No available translations')
                    }) : null
                )
            );
        }

        return React.createElement(
            'li',
            null,
            React.createElement(
                'a',
                {title: gettextCatalog.getString(activity.label), onClick: this.run},
                React.createElement('i', {
                    className: 'icon-' + activity.icon
                }),
                React.createElement('span', {
                    style: {display: 'inline'}
                }, gettextCatalog.getString(activity.label))
            )
        );
    }
}

Item.propTypes = {
    svc: React.PropTypes.object.isRequired,
    scope: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
    activity: React.PropTypes.any,
    onActioning: React.PropTypes.func
};
