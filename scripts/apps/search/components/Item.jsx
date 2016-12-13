import React from 'react';
import classNames from 'classnames';

import {broadcast} from 'apps/search/components/fields';

import {
    ItemPriority,
    ItemUrgency,
    MediaPreview,
    MediaInfo,
    GridTypeIcon,
    ListTypeIcon,
    ListPriority,
    ActionsMenu,
    ErrorBox,
    ProgressBar,
    ListItemInfo
} from 'apps/search/components';

/**
 * Item component
 */
export class Item extends React.Component {
    constructor(props) {
        super(props);

        this.state = {hover: false};

        this.select = this.select.bind(this);
        this.selectTakesPackage = this.selectTakesPackage.bind(this);
        this.selectUpdate = this.selectUpdate.bind(this);
        this.edit = this.edit.bind(this);
        this.dbClick = this.dbClick.bind(this);
        this.setHoverState = this.setHoverState.bind(this);
        this.unsetHoverState = this.unsetHoverState.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.swimlane !== this.props.swimlane || nextProps.item !== this.props.item ||
            nextProps.view !== this.props.view ||
            nextProps.flags.selected !== this.props.flags.selected ||
            nextState !== this.state;
    }

    select(event) {
        if (!this.props.item.gone) {
            this.props.onSelect(this.props.item, event);
        }
    }

    selectTakesPackage() {
        this.props.onSelect(this.props.item.takes || this.props.item.archive_item.takes);
    }

    selectUpdate() {
        const {authoringWorkspace} = this.props.svc;

        authoringWorkspace.edit({_id: this.props.item.rewritten_by}, 'view');
    }

    edit(event) {
        if (!this.props.item.gone) {
            this.props.onEdit(this.props.item);
        }
    }

    dbClick(event) {
        if (!this.props.item.gone) {
            this.props.onDbClick(this.props.item);
        }
    }

    setHoverState() {
        this.setState({hover: true});
    }

    unsetHoverState() {
        this.setState({hover: false});
    }

    onDragStart(event) {
        const {dragitem} = this.props.svc;

        dragitem.start(event, this.props.item);
    }

    render() {
        var item = this.props.item;
        var contents = [
            'div',
            {
                className: classNames(
                    'media-box',
                    'media-' + item.type,
                    {
                        locked: item.lock_user && item.lock_session,
                        selected: this.props.flags.selected,
                        archived: item.archived || item.created,
                        gone: item.gone
                    }
                )

            }
        ];

        if (item._progress) {
            contents.push(React.createElement(ProgressBar, {completed: item._progress}));
        }

        const getActionsMenu = () =>
            this.state.hover && !item.gone ? React.createElement(
                ActionsMenu,
                {item: item, svc: this.props.svc, scope: this.props.scope}
            ) : null;

        if (this.props.view === 'mgrid') {
            contents.push(
                item.archiveError ? React.createElement(ErrorBox, {svc: this.props.svc}) : null,
                React.createElement(MediaPreview, {
                    item: item,
                    desk: this.props.desk,
                    onMultiSelect: this.props.onMultiSelect,
                    swimlane: this.props.swimlane,
                    svc: this.props.svc
                }),
                React.createElement(MediaInfo, {
                    item: item,
                    ingestProvider: this.props.ingestProvider,
                    svc: this.props.svc
                }),
                React.createElement(GridTypeIcon, {item: item}),
                item.priority ?
                    React.createElement(ItemPriority, angular.extend({svc: this.props.svc}, item)) : null,
                item.urgency ?
                    React.createElement(ItemUrgency, angular.extend({svc: this.props.svc}, item)) : null,
                broadcast({item: item}),
                getActionsMenu()
            );
        } else {
            contents.push(
                React.createElement('span', {className: 'state-border'}),
                React.createElement(ListTypeIcon, {
                    item: item,
                    onMultiSelect: this.props.onMultiSelect,
                    swimlane: this.props.swimlane
                }),
                item.priority || item.urgency ? React.createElement(ListPriority, {
                    item: item,
                    svc: this.props.svc,
                    scope: this.props.scope
                }) : null,
                React.createElement(ListItemInfo, {
                    item: item,
                    selectTakesPackage: this.selectTakesPackage,
                    selectUpdate: this.selectUpdate,
                    desk: this.props.desk,
                    ingestProvider: this.props.ingestProvider,
                    highlightsById: this.props.highlightsById,
                    profilesById: this.props.profilesById,
                    swimlane: this.props.swimlane,
                    versioncreator: this.props.versioncreator,
                    svc: this.props.svc,
                    scope: this.props.scope
                }),
                getActionsMenu()
            );
        }

        return React.createElement(
            'li', {
                id: item._id,
                key: item._id,
                className: classNames(
                    'list-item-view',
                    {active: this.props.flags.selected},
                    {selected: this.props.item.selected}
                ),
                onMouseEnter: this.setHoverState,
                onMouseLeave: this.unsetHoverState,
                onDragStart: this.onDragStart,
                onClick: this.select,
                onDoubleClick: this.dbClick,
                draggable: true,
                tabIndex: '0'
            },
            React.createElement.apply(null, contents)
        );
    }
}

Item.propTypes = {
    svc: React.PropTypes.object.isRequired,
    scope: React.PropTypes.any.isRequired,
    swimlane: React.PropTypes.any,
    item: React.PropTypes.any,
    profilesById: React.PropTypes.any,
    highlightsById: React.PropTypes.any,
    ingestProvider: React.PropTypes.any,
    versioncreator: React.PropTypes.any,
    onMultiSelect: React.PropTypes.any,
    desk: React.PropTypes.any,
    flags: React.PropTypes.any,
    view: React.PropTypes.any,
    onDbClick: React.PropTypes.any,
    onEdit: React.PropTypes.any,
    onSelect: React.PropTypes.any,
};
