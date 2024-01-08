/* eslint-disable react/no-multi-comp */

import React from 'react';
import classNames from 'classnames';
import {get} from 'lodash';

import {ActionsMenu} from './actions-menu/ActionsMenu';
import {closeActionsMenu, isIPublishedArticle} from '../helpers';
import {gettext} from 'core/utils';
import {ItemSwimlane} from './ItemSwimlane';
import {ItemPhotoGrid} from './ItemPhotoGrid';
import {ListItemTemplate} from './ItemListTemplate';
import {ItemMgridTemplate} from './ItemMgridTemplate';
import {IArticle, IDesk, IPublishedArticle} from 'superdesk-api';
import {querySelectorParent} from 'core/helpers/dom/querySelectorParent';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {appConfig} from 'appConfig';
import ng from 'core/services/ng';
import {IScopeApply} from 'core/utils';
import {ILegacyMultiSelect, IMultiSelectNew} from './ItemList';
import {IActivityService} from 'core/activity/activity';
import {IActivity} from 'superdesk-interfaces/Activity';
import {IRelatedEntities} from 'core/getRelatedEntities';
import {dragStart} from 'utils/dragging';

export function isButtonClicked(event): boolean {
    // don't trigger the action if a button inside a list view is clicked
    // if an extension registers a button, it should be able to totally control it.
    // target can be an image or an icon inside a button, so parents need to be checked too
    return querySelectorParent(event.target, 'button', {self: true}) != null;
}

const CLICK_TIMEOUT = 300;

const actionsMenuDefaultTemplate = (toggle, stopEvent) => (
    <div
        className="item-right toolbox"
        style={{display: 'flex', justifyContent: 'space-evenly', alignItems: 'center'}}
    >
        <button
            onClick={toggle}
            onDoubleClick={stopEvent}
            className="more-activity-toggle-ref icn-btn dropdown__toggle dropdown-toggle"
            aria-label={gettext('Item actions')}
            data-test-id="context-menu-button"
        >
            <i className="icon-dots-vertical" />
        </button>
    </div>
);

interface IProps {
    swimlane: any;
    item: IArticle | IPublishedArticle;
    relatedEntities: IRelatedEntities;
    profilesById: any;
    highlightsById: any;
    markedDesksById: any;
    ingestProvider: any;
    versioncreator: any;
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
    desk: IDesk;
    flags: any;
    view: any;
    onDbClick: any;
    onEdit: any;
    onSelect(item: IArticle, event): void;
    narrow: any;
    hideActions: boolean;
    multiSelectDisabled: boolean;
    isNested: boolean;
    actioning: boolean;
    singleLine: any;
    customRender: any;
    scopeApply: IScopeApply;
}

interface IState {
    hover: boolean;
    actioning: boolean;
    isActionMenuOpen: boolean;
    showNested: boolean;
    loading: boolean;
    nested: Array<IArticle>;
}

export class Item extends React.Component<IProps, IState> {
    private clickTimeout: number;
    private _mounted: boolean;
    private mouseDown: boolean;

    constructor(props) {
        super(props);

        this.state = {
            hover: false,
            actioning: false,
            isActionMenuOpen: false,
            showNested: false,
            loading: false,
            nested: [],
        };

        this.handleClick = this.handleClick.bind(this);
        this.edit = this.edit.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.setActioningState = this.setActioningState.bind(this);
        this.setHoverState = this.setHoverState.bind(this);
        this.unsetHoverState = this.unsetHoverState.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.openAuthoringView = this.openAuthoringView.bind(this);
        this.toggleNested = this.toggleNested.bind(this);
    }

    componentWillMount() {
        if (appConfig?.apps?.includes('superdesk-planning')) {
            this.loadPlanningModals();
        }
    }

    componentDidMount() {
        this._mounted = true;
    }

    componentWillUnmount() {
        this._mounted = false;
        closeActionsMenu(this.props.item._id);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.item !== this.props.item) {
            closeActionsMenu(this.props.item._id);
        }
        this.setActioningState(nextProps.actioning);
    }

    loadPlanningModals() {
        const session = ng.get('session');
        const superdesk = ng.get('superdesk');
        const activityService: IActivityService = ng.get('activityService');

        if (!['add_to_planning', 'fulfil_assignment'].includes(get(this.props, 'item.lock_action')) ||
                get(this.props, 'item.lock_user') !== session.identity._id ||
                get(this.props, 'item.lock_session') !== session.sessionId) {
            return;
        }

        let planningActivity: IActivity | null;
        const activities = superdesk.findActivities({action: 'list', type: 'archive'},
            this.props.item);

        // Planning: if page probably was refreshed / loaded during the add-to-planning operation,
        // reload the add-to-planning modal
        if (this.props.item.lock_action === 'add_to_planning') {
            planningActivity = activities.find((a) => a._id === 'planning.addto');
        } else if (this.props.item.lock_action === 'fulfil_assignment') {
            planningActivity = activities.find((a) => a._id === 'planning.fulfil');
        }

        const openActivities = activityService.activityStack || [];

        // Item list is rerendered from planning on certain actions and this will trigger
        // opening a modal that might be open already (without page refresh)
        if (openActivities.find(({activity}) => activity._id === planningActivity._id) != null) {
            // if activity is open already, don't do anything
            return;
        }

        if (planningActivity) {
            this.setActioningState(true);
            activityService.start(planningActivity, {data: {item: this.props.item}})
                .finally(() => {
                    if (this._mounted) {
                        this.setActioningState(false);
                    }
                });
        }
    }

    shouldComponentUpdate(nextProps: IProps, nextState) {
        return nextProps.swimlane !== this.props.swimlane || nextProps.item !== this.props.item ||
            nextProps.view !== this.props.view ||
            nextProps.flags.selected !== this.props.flags.selected ||
            nextProps.narrow !== this.props.narrow ||
            nextProps.actioning !== this.props.actioning ||
            nextProps.multiSelect !== this.props.multiSelect ||
            nextState !== this.state;
    }

    handleClick(event) {
        if (isButtonClicked(event)) {
            return;
        }

        if (!this.props.item.gone && !this.clickTimeout) {
            event.persist(); // make event available in timeout callback
            this.clickTimeout = window.setTimeout(() => {
                this.clickTimeout = null;
                this.props.onSelect(this.props.item, event);
            }, CLICK_TIMEOUT);
        }
    }

    /**
     * Opens the item in authoring in view mode
     * @param {string} itemId Id of the document
     */
    openAuthoringView(itemId) {
        const authoringWorkspace: AuthoringWorkspaceService = ng.get('authoringWorkspace');

        authoringWorkspace.edit({_id: itemId}, 'view');
    }

    edit(event) {
        if (!this.props.item.gone) {
            this.props.onEdit(this.props.item);
        }
    }

    handleDoubleClick(event) {
        if (isButtonClicked(event)) {
            return;
        }

        if (this.clickTimeout) {
            window.clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }

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
        if (this.state.hover !== true) {
            this.setState({hover: true});
        }
    }

    unsetHoverState() {
        this.setState({hover: false});
    }

    onDragStart(event) {
        dragStart(event, this.props.item);
    }

    toggleNested(event) {
        event.stopPropagation();

        const showNested = !this.state.showNested;

        if (showNested && isIPublishedArticle(this.props.item) && !this.state.loading && !this.state.nested.length) {
            this.setState({loading: true});
            this.fetchNested(this.props.item);
        }

        this.setState({showNested: !this.state.showNested});
    }

    fetchNested(item: IPublishedArticle) {
        httpRequestJsonLocal<{_items: Array<IArticle>}>({
            method: 'GET',
            path: '/published',
            urlParams: {
                source: {
                    query: {
                        bool: {
                            must: {term: {family_id: item.archive_item.family_id}},
                            must_not: {term: {_id: item.item_id}},
                        },
                    },
                    sort: [{'versioncreated': 'desc'}],
                },
            },
        }).then((data) => {
            this.setState({loading: false, nested: data._items});
        }).catch(() => {
            this.setState({loading: false});
        });
    }

    render() {
        const {item} = this.props;
        let classes = this.props.view === 'photogrid' ?
            'sd-grid-item sd-grid-item--with-click' :
            'media-box media-' + item.type;

        const selectedInSingleSelectMode = this.props.flags.selected;
        const selectedInMultiSelectMode = this.props.item.selected;
        const itemSelected = selectedInSingleSelectMode || selectedInMultiSelectMode;

        // Customize item class from its props
        if (this.props.customRender && typeof this.props.customRender.getItemClass === 'function') {
            classes = `${classes} ${this.props.customRender.getItemClass(item)}`;
        }

        const isLocked: boolean = (item.lock_user && item.lock_session) != null;

        const getActionsMenu = (template = actionsMenuDefaultTemplate) =>
            this.props.hideActions !== true
            && (this.state.hover || itemSelected)
            && !item.gone
                ? (
                    <ActionsMenu
                        item={item}
                        onActioning={this.setActioningState}
                        template={template}
                        scopeApply={this.props.scopeApply}
                    />
                ) : null;

        const getTemplate = () => {
            switch (this.props.view) {
            case 'swimlane2':
                return (
                    <ItemSwimlane
                        item={item}
                        itemSelected={itemSelected}
                        isLocked={isLocked}
                        getActionsMenu={getActionsMenu}
                        multiSelect={this.props.multiSelect}
                    />
                );
            case 'mgrid':
                return (
                    <ItemMgridTemplate
                        item={item}
                        itemSelected={itemSelected}
                        desk={this.props.desk}
                        swimlane={this.props.swimlane}
                        ingestProvider={this.props.ingestProvider}
                        getActionsMenu={getActionsMenu}
                        multiSelect={this.props.multiSelect}
                    />
                );
            case 'photogrid':
                return (
                    <ItemPhotoGrid
                        item={item}
                        itemSelected={itemSelected}
                        desk={this.props.desk}
                        swimlane={this.props.swimlane}
                        multiSelect={this.props.multiSelect}
                        getActionsMenu={getActionsMenu}
                    />
                );
            default:
                return (
                    <ListItemTemplate
                        item={item}
                        relatedEntities={this.props.relatedEntities}
                        itemSelected={itemSelected}
                        desk={this.props.desk}
                        openAuthoringView={this.openAuthoringView}
                        ingestProvider={this.props.ingestProvider}
                        highlightsById={this.props.highlightsById}
                        markedDesksById={this.props.markedDesksById}
                        profilesById={this.props.profilesById}
                        swimlane={this.props.swimlane}
                        versioncreator={this.props.versioncreator}
                        narrow={this.props.narrow}
                        multiSelect={this.props.multiSelect}
                        getActionsMenu={getActionsMenu}
                        selectingDisabled={this.props.multiSelectDisabled}
                        isNested={this.props.isNested}
                        showNested={this.state.showNested}
                        toggleNested={this.toggleNested}
                        singleLine={this.props.singleLine}
                        customRender={this.props.customRender}
                    />
                );
            }
        };

        const getNested = () => {
            switch (this.props.view) {
            case 'swimlane2':
            case 'mgrid':
            case 'photogrid':
                return null;
            default:
                if (!this.state.nested.length) {
                    return null;
                }

                return (
                    <div className="sd-list-item-nested__childs sd-shadow--z1">
                        {this.state.nested.map((childItem) => (
                            <Item
                                item={childItem}
                                relatedEntities={this.props.relatedEntities}
                                key={childItem._id + childItem._current_version}
                                flags={{}}
                                profilesById={this.props.profilesById}
                                isNested={true}
                                narrow={true}
                                hideActions={true}
                                onSelect={() => null}
                                multiSelectDisabled={false}
                                swimlane={this.props.swimlane}
                                highlightsById={this.props.highlightsById}
                                markedDesksById={this.props.markedDesksById}
                                ingestProvider={this.props.ingestProvider}
                                desk={this.props.desk}
                                view={this.props.view}
                                versioncreator={this.props.versioncreator}
                                onEdit={this.props.onEdit}
                                onDbClick={this.props.onDbClick}
                                multiSelect={this.props.multiSelect}
                                actioning={false}
                                singleLine={this.props.singleLine}
                                customRender={this.props.customRender}
                                scopeApply={this.props.scopeApply}
                            />
                        ))}
                    </div>
                );
            }
        };

        // avoid any actions on nested items
        const getCallback = (func) => this.props.isNested ? (event) => event.stopPropagation() : func;

        return React.createElement(
            this.props.isNested ? 'div' : 'li',
            {
                id: item._id,
                key: item._id,
                className: classNames(
                    'list-item-view',
                    {
                        'actions-visible': this.props.hideActions !== true,
                        'active': itemSelected,
                        'selected': this.props.item.selected && !this.props.flags.selected,
                        'sd-list-item-nested': this.state.nested.length,
                        'sd-list-item-nested--expanded': this.state.nested.length && this.state.showNested,
                        'sd-list-item-nested--collapsed': this.state.nested.length && this.state.showNested === false,
                    },
                ),
                onMouseOver: getCallback(this.setHoverState),
                onMouseLeave: getCallback(this.unsetHoverState),
                onDragStart: getCallback(this.onDragStart),
                onFocus: getCallback((event) => {
                    // Only open preview on focus when it is triggered via keyboard.
                    // When mouse is used, preview will open on click.
                    if (this.mouseDown !== true) {
                        // not using this.select in order to avoid the timeout
                        // that is used to enable double-click
                        if (!this.props.item.gone) {
                            this.props.onSelect(this.props.item, event);
                        }
                    }
                }),
                onMouseDown: () => {
                    this.mouseDown = true;
                },
                onMouseUp: () => {
                    this.mouseDown = false;
                },
                onClick: getCallback(this.handleClick),
                onDoubleClick: getCallback(this.handleDoubleClick),
                onKeyDown: (event) => {
                    if (event.key === ' ') { // display item actions when space is clicked
                        const el = event.target?.querySelector('.more-activity-toggle-ref');

                        if (typeof el?.click === 'function') {
                            event.preventDefault();
                            el.click();
                        }
                    }
                },
                draggable: !this.props.isNested,
                tabIndex: 0,
                'data-test-id': 'article-item',
            },
            (
                <div
                    className={classNames(classes, {
                        active: itemSelected,
                        locked: isLocked,
                        selected: itemSelected,
                        archived: item.archived || item.created,
                        gone: item.gone,
                        actioning: this.state.actioning || this.props.actioning,
                    })}
                >
                    {getTemplate()}
                </div>
            ),
            getNested(),
        );
    }
}
