import React from 'react';
import PropTypes from 'prop-types';
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
import {closeActionsMenu} from '../helpers';

/**
 * Item component
 */
export class Item extends React.Component {
    constructor(props) {
        super(props);

        this.state = {hover: false, actioning: false, isActionMenuOpen: false};

        this.select = this.select.bind(this);
        this.edit = this.edit.bind(this);
        this.dbClick = this.dbClick.bind(this);
        this.setActioningState = this.setActioningState.bind(this);
        this.setHoverState = this.setHoverState.bind(this);
        this.unsetHoverState = this.unsetHoverState.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.openAuthoringView = this.openAuthoringView.bind(this);
        this.setActionMenuState = this.setActionMenuState.bind(this);
    }

    componentWillUnmount() {
        if (this.state.isActionMenuOpen) {
            closeActionsMenu();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.isActionMenuOpen && nextProps.item !== this.props.item) {
            this.setActionMenuState(false);
            closeActionsMenu();
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.swimlane !== this.props.swimlane || nextProps.item !== this.props.item ||
            nextProps.view !== this.props.view ||
            nextProps.flags.selected !== this.props.flags.selected ||
            nextProps.narrow !== this.props.narrow ||
            nextState !== this.state;
    }

    setActionMenuState(value) {
        this.setState({isActionMenuOpen: value});
    }

    select(event) {
        if (!this.props.item.gone) {
            this.props.onSelect(this.props.item, event);
        }
    }

    /**
     * Opens the item in authoring in view mode
     * @param {string} itemId Id of the document
     */
    openAuthoringView(itemId) {
        const {authoringWorkspace} = this.props.svc;

        authoringWorkspace.edit({_id: itemId}, 'view');
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

    /**
     * Set Actioning state
     * @param {Boolean} isActioning - true if activity is in-progress, and false if completed
     */
    setActioningState(isActioning) {
        this.setState({actioning: isActioning});
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
                        gone: item.gone,
                        actioning: this.state.actioning
                    }
                )

            }
        ];

        if (item._progress) {
            contents.push(React.createElement(ProgressBar, {completed: item._progress}));
        }

        const getActionsMenu = () => {
            const {scope} = this.props;

            return !_.get(scope, 'flags.hideActions') && this.state.hover && !item.gone ? React.createElement(
                ActionsMenu, {
                    item: item,
                    svc: this.props.svc,
                    scope: this.props.scope,
                    onActioning: this.setActioningState,
                    onToggle: this.setActionMenuState
                }) : null;
        };

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
                React.createElement(GridTypeIcon, {item: item, svc: this.props.svc}),
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
                    swimlane: this.props.swimlane,
                    svc: this.props.svc
                }),
                item.priority || item.urgency ? React.createElement(ListPriority, {
                    item: item,
                    svc: this.props.svc,
                    scope: this.props.scope
                }) : null,
                React.createElement(ListItemInfo, {
                    item: item,
                    openAuthoringView: this.openAuthoringView,
                    desk: this.props.desk,
                    ingestProvider: this.props.ingestProvider,
                    highlightsById: this.props.highlightsById,
                    markedDesksById: this.props.markedDesksById,
                    profilesById: this.props.profilesById,
                    swimlane: this.props.swimlane,
                    versioncreator: this.props.versioncreator,
                    narrow: this.props.narrow,
                    svc: this.props.svc,
                    scope: this.props.scope
                }),
                getActionsMenu()
            );
        }

        let multiSelected = this.props.item.selected;

        // If an item is both multi-selected and is active selection in the list
        // remove the 'selected' styling class to distinguish it as the active item
        if (this.props.item.selected && this.props.flags.selected) {
            multiSelected = !multiSelected;
        }

        return React.createElement(
            'li', {
                id: item._id,
                key: item._id,
                className: classNames(
                    'list-item-view',
                    {active: this.props.flags.selected},
                    {selected: multiSelected}
                ),
                onMouseEnter: this.setHoverState,
                onMouseLeave: this.unsetHoverState,
                onDragStart: this.onDragStart,
                onClick: this.select,
                onDoubleClick: this.dbClick,
                draggable: true
            },
            React.createElement.apply(null, contents)
        );
    }
}

Item.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    swimlane: PropTypes.any,
    item: PropTypes.any,
    profilesById: PropTypes.any,
    highlightsById: PropTypes.any,
    markedDesksById: PropTypes.any,
    ingestProvider: PropTypes.any,
    versioncreator: PropTypes.any,
    onMultiSelect: PropTypes.any,
    desk: PropTypes.any,
    flags: PropTypes.any,
    view: PropTypes.any,
    onDbClick: PropTypes.any,
    onEdit: PropTypes.any,
    onSelect: PropTypes.any,
    narrow: PropTypes.any
};
