/* eslint-disable react/no-multi-comp */

import React from 'react';
import classNames from 'classnames';
import {get} from 'lodash';

import {broadcast} from './fields/broadcast';

import {ActionsMenu} from './actions-menu/ActionsMenu';
import {closeActionsMenu, isIPublishedArticle} from '../helpers';
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

function isButtonClicked(event): boolean {
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
            data-test-id="context-menu-button"
        >
            <i className="icon-dots-vertical" />
        </button>
    </div>
);

interface IProps {
    swimlane: any;
    item: IArticle | IPublishedArticle;
    profilesById: any;
    highlightsById: any;
    markedDesksById: any;
    ingestProvider: any;
    versioncreator: any;
    onMultiSelect: any;
    desk: IDesk;
    flags: any;
    view: any;
    onDbClick: any;
    onEdit: any;
    onSelect: any;
    narrow: any;
    hideActions: boolean;
    multiSelectDisabled: boolean;
    isNested: boolean;
    actioning: boolean;
    singleLine: any;
    customRender: any;
    viewType: any;
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
    clickTimeout: number;

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

        this.select = this.select.bind(this);
        this.edit = this.edit.bind(this);
        this.dbClick = this.dbClick.bind(this);
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

    componentWillUnmount() {
        closeActionsMenu(this.props.item._id);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.item !== this.props.item) {
            closeActionsMenu(this.props.item._id);
        }
    }

    loadPlanningModals() {
        const session = ng.get('session');
        const superdesk = ng.get('superdesk');
        const activityService = ng.get('activityService');

        if (!['add_to_planning', 'fulfil_assignment'].includes(get(this.props, 'item.lock_action')) ||
                get(this.props, 'item.lock_user') !== session.identity._id ||
                get(this.props, 'item.lock_session') !== session.sessionId) {
            return;
        }

        let planningActivity;
        const activities = superdesk.findActivities({action: 'list', type: 'archive'},
            this.props.item);

        // Planning: if page probably was refreshed / loaded during the add-to-planning operation,
        // reload the add-to-planning modal
        if (this.props.item.lock_action === 'add_to_planning') {
            planningActivity = activities.find((a) => a._id === 'planning.addto');
        } else if (this.props.item.lock_action === 'fulfil_assignment') {
            planningActivity = activities.find((a) => a._id === 'planning.fulfil');
        }

        if (planningActivity) {
            this.setActioningState(true);
            activityService.start(planningActivity, {data: {item: this.props.item}})
                .finally(() => this.setActioningState(false));
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.swimlane !== this.props.swimlane || nextProps.item !== this.props.item ||
            nextProps.view !== this.props.view ||
            nextProps.flags.selected !== this.props.flags.selected ||
            nextProps.narrow !== this.props.narrow ||
            nextProps.actioning !== this.props.actioning ||
            nextState !== this.state;
    }

    select(event) {
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

    dbClick(event) {
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
        ng.get('dragitem').start(event, this.props.item);
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
            urlParams: {source: JSON.stringify({
                query: {
                    bool: {
                        must: {term: {family_id: item.archive_item.family_id}},
                        must_not: {term: {_id: item.item_id}},
                    },
                },
                sort: [{'versioncreated': 'desc'}],
            })},
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

        // Customize item class from its props
        if (this.props.customRender && typeof this.props.customRender.getItemClass === 'function') {
            classes = `${classes} ${this.props.customRender.getItemClass(item)}`;
        }

        const isLocked: boolean = (item.lock_user && item.lock_session) != null;

        const getActionsMenu = (template = actionsMenuDefaultTemplate) =>
            this.props.hideActions !== true && this.state.hover && !item.gone ? (
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
                        isLocked={isLocked}
                        getActionsMenu={getActionsMenu}
                        onMultiSelect={this.props.onMultiSelect}
                    />
                );
            case 'mgrid':
                return (
                    <ItemMgridTemplate
                        item={item}
                        desk={this.props.desk}
                        swimlane={this.props.swimlane}
                        ingestProvider={this.props.ingestProvider}
                        onMultiSelect={this.props.onMultiSelect}
                        broadcast={broadcast}
                        getActionsMenu={getActionsMenu}
                    />
                );
            case 'photogrid':
                return (
                    <ItemPhotoGrid
                        item={item}
                        desk={this.props.desk}
                        swimlane={this.props.swimlane}
                        onMultiSelect={this.props.onMultiSelect}
                        getActionsMenu={getActionsMenu}
                    />
                );
            default:
                return (
                    <ListItemTemplate
                        item={item}
                        desk={this.props.desk}
                        openAuthoringView={this.openAuthoringView}
                        ingestProvider={this.props.ingestProvider}
                        highlightsById={this.props.highlightsById}
                        markedDesksById={this.props.markedDesksById}
                        profilesById={this.props.profilesById}
                        swimlane={this.props.swimlane}
                        versioncreator={this.props.versioncreator}
                        narrow={this.props.narrow}
                        onMultiSelect={this.props.onMultiSelect}
                        getActionsMenu={getActionsMenu}
                        selectingDisabled={this.props.multiSelectDisabled}
                        isNested={this.props.isNested}
                        showNested={this.state.showNested}
                        toggleNested={this.toggleNested}
                        singleLine={this.props.singleLine}
                        customRender={this.props.customRender}
                        viewType={this.props.viewType}
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
                                onMultiSelect={this.props.onMultiSelect}
                                actioning={false}
                                singleLine={this.props.singleLine}
                                customRender={this.props.customRender}
                                viewType={this.props.viewType}
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
                        'active': this.props.flags.selected,
                        'selected': this.props.item.selected && !this.props.flags.selected,
                        'sd-list-item-nested': this.state.nested.length,
                        'sd-list-item-nested--expanded': this.state.nested.length && this.state.showNested,
                        'sd-list-item-nested--collapsed': this.state.nested.length && this.state.showNested === false,
                    },
                ),
                onMouseOver: getCallback(this.setHoverState),
                onMouseLeave: getCallback(this.unsetHoverState),
                onDragStart: getCallback(this.onDragStart),
                onClick: getCallback(this.select),
                onDoubleClick: getCallback(this.dbClick),
                draggable: !this.props.isNested,
            },
            (
                <div
                    className={classNames(classes, {
                        active: this.props.flags.selected,
                        locked: isLocked,
                        selected: this.props.item.selected || this.props.flags.selected,
                        archived: item.archived || item.created,
                        gone: item.gone,
                        actioning: this.state.actioning || this.props.actioning,
                    })}
                    data-test-id="article-item"
                >
                    {getTemplate()}
                </div>
            ),
            getNested(),
        );
    }
}
